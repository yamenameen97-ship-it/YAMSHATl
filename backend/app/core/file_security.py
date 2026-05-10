from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status

DANGEROUS_NAME_MARKERS = {'.php', '.phtml', '.phar', '.exe', '.dll', '.sh', '.bat', '.cmd', '.ps1', '.jsp', '.asp', '.js'}
EXTENSION_TO_MIME = {
    '.png': {'image/png'},
    '.jpg': {'image/jpeg'},
    '.jpeg': {'image/jpeg'},
    '.webp': {'image/webp'},
    '.gif': {'image/gif'},
    '.mp4': {'video/mp4'},
    '.mov': {'video/quicktime', 'video/mp4'},
    '.webm': {'video/webm'},
}
MAGIC_SIGNATURES: list[tuple[bytes, str, str]] = [
    (b'\x89PNG\r\n\x1a\n', 'image/png', 'png'),
    (b'\xff\xd8\xff', 'image/jpeg', 'jpeg'),
    (b'GIF87a', 'image/gif', 'gif'),
    (b'GIF89a', 'image/gif', 'gif'),
    (b'RIFF', 'image/webp', 'webp-riff'),
    (b'\x1a\x45\xdf\xa3', 'video/webm', 'webm'),
    (b'%PDF', 'application/pdf', 'pdf'),
    (b'MZ', 'application/x-msdownload', 'mz-executable'),
    (b'#!', 'text/x-shellscript', 'shell'),
    (b'<?php', 'application/x-php', 'php'),
    (b'\x7fELF', 'application/x-elf', 'elf'),
]


def _looks_like_mov_or_mp4(data: bytes) -> str | None:
    if len(data) < 12:
        return None
    if data[4:8] != b'ftyp':
        return None
    brand = data[8:12]
    if brand in {b'qt  '}:
        return 'video/quicktime'
    return 'video/mp4'


def detect_mime_from_magic(data: bytes) -> tuple[str, str]:
    sample = bytes(data[:512])
    if len(sample) >= 12:
        mov_or_mp4 = _looks_like_mov_or_mp4(sample)
        if mov_or_mp4:
            return mov_or_mp4, 'ftyp'
        if sample.startswith(b'RIFF') and sample[8:12] == b'WEBP':
            return 'image/webp', 'webp'
    lowered = sample.lower()
    for signature, mime, label in MAGIC_SIGNATURES:
        if lowered.startswith(signature.lower()):
            return mime, label
    return 'application/octet-stream', 'unknown'


def _suspicious_filename(filename: str) -> bool:
    suffixes = [suffix.lower() for suffix in Path(filename).suffixes]
    if not suffixes:
        return False
    return any(suffix in DANGEROUS_NAME_MARKERS for suffix in suffixes[:-1])


async def _perform_antivirus_scan(file_path: str) -> dict[str, Any]:
    """
    محاكاة فحص الفيروسات باستخدام خدمة خارجية.
    في بيئة الإنتاج يمكن استبدالها بخدمة مثل ClamAV أو VirusTotal.
    """
    if os.urandom(1)[0] < 3:
        return {'is_infected': True, 'threats': ['EICAR-Test-File'], 'scan_details': 'Simulated threat detection'}
    return {'is_infected': False, 'threats': [], 'scan_details': 'No threats detected'}


async def _perform_nsfw_detection(file_path: str) -> dict[str, Any]:
    """
    محاكاة اكتشاف المحتوى غير اللائق باستخدام خدمة AI خارجية.
    """
    if os.urandom(1)[0] < 1:
        return {'is_nsfw': True, 'score': 0.95, 'categories': ['pornography', 'gore'], 'details': 'Simulated NSFW content'}
    return {'is_nsfw': False, 'score': 0.01, 'categories': [], 'details': 'Content is safe'}


async def _perform_media_sandboxing(file_path: str) -> dict[str, Any]:
    """
    محاكاة تحليل الملف داخل بيئة معزولة.
    في الإنتاج يمكن ربطها بخدمة تفحص الفيديو أو الصور في Sandbox منفصل.
    """
    return {'is_safe_for_delivery': True, 'analysis_report': 'Simulated sandbox analysis: no malicious behavior'}


async def validate_upload_bytes(filename: str, declared_content_type: str | None, data: bytes) -> dict[str, Any]:
    suffix = Path(filename or '').suffix.lower()
    if _suspicious_filename(filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Suspicious double extension detected')
    if suffix not in EXTENSION_TO_MIME:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported file extension')

    detected_mime, signature = detect_mime_from_magic(data)
    allowed_mimes = EXTENSION_TO_MIME[suffix]
    declared = str(declared_content_type or '').split(';', 1)[0].strip().lower() or 'application/octet-stream'

    if detected_mime == 'application/octet-stream':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unable to verify real file MIME type')
    if detected_mime not in allowed_mimes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='File content does not match extension')
    if declared not in {'', 'application/octet-stream'} and declared not in allowed_mimes and declared != detected_mime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Declared MIME type is invalid')
    if signature in {'mz-executable', 'shell', 'php', 'elf'}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Executable uploads are blocked')

    temp_file_path = f'/tmp/{Path(filename).name}'
    with open(temp_file_path, 'wb') as temp_file:
        temp_file.write(data)

    try:
        antivirus_result = await _perform_antivirus_scan(temp_file_path)
        if antivirus_result['is_infected']:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File infected: {antivirus_result['threats']}")

        nsfw_result = await _perform_nsfw_detection(temp_file_path)
        if nsfw_result['is_nsfw']:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"NSFW content detected: {nsfw_result['categories']}")

        sandboxing_result = await _perform_media_sandboxing(temp_file_path)
        if not sandboxing_result['is_safe_for_delivery']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Media sandboxing failed: {sandboxing_result['analysis_report']}",
            )
    finally:
        try:
            os.remove(temp_file_path)
        except FileNotFoundError:
            pass

    return {
        'extension': suffix.lstrip('.'),
        'declared_mime': declared,
        'detected_mime': detected_mime,
        'magic_signature': signature,
        'antivirus_scan': antivirus_result,
        'nsfw_detection': nsfw_result,
        'media_sandboxing': sandboxing_result,
    }
