from fastapi import FastAPI, HTTPException, status
from typing import Dict, Any
from backend.core.errors import APIException, ErrorCode
from backend.core.logger import get_logger

app = FastAPI()
logger = get_logger(__name__)

# Placeholder for a more advanced translation mechanism (e.g., database, external API)
TRANSLATIONS = {
    "ar": {
        "hello": "مرحباً",
        "welcome": "أهلاً وسهلاً",
        "goodbye": "إلى اللقاء",
        "wallet": "المحفظة",
        "security": "الأمان",
        "settings": "الإعدادات",
        "balance": "الرصيد",
        "deposit": "إيداع",
        "withdraw": "سحب"
    },
    "en": {
        "hello": "Hello",
        "welcome": "Welcome",
        "goodbye": "Goodbye",
        "wallet": "Wallet",
        "security": "Security",
        "settings": "Settings",
        "balance": "Balance",
        "deposit": "Deposit",
        "withdraw": "Withdraw"
    },
    "fr": {
        "hello": "Bonjour",
        "welcome": "Bienvenue",
        "goodbye": "Au revoir"
    },
    "tr": {
        "hello": "Merhaba",
        "welcome": "Hoş geldiniz",
        "goodbye": "Güle güle"
    }
}

@app.post("/translate")
async def translate_text(text: str, target_lang: str, source_lang: str = "auto") -> Dict[str, str]:
    if target_lang not in TRANSLATIONS:
        raise APIException(code=ErrorCode.BAD_REQUEST, message="Unsupported target language", status_code=status.HTTP_400_BAD_REQUEST)
    
    # In a real scenario, source_lang would be used for detection or specific translation APIs
    translated_text = TRANSLATIONS[target_lang].get(text.lower(), text) # Simple lookup for demo
    logger.info(f"Translated \'{text}\' to \'{target_lang}\' as \'{translated_text}\'")
    return {"original_text": text, "translated_text": translated_text, "target_language": target_lang}

@app.get("/languages")
async def get_supported_languages() -> Dict[str, Any]:
    return {"supported_languages": list(TRANSLATIONS.keys())}

@app.get("/phrases/{lang}")
async def get_language_phrases(lang: str) -> Dict[str, Any]:
    if lang not in TRANSLATIONS:
        raise APIException(code=ErrorCode.NOT_FOUND, message="Language not found", status_code=status.HTTP_404_NOT_FOUND)
    return {"language": lang, "phrases": TRANSLATIONS[lang]}
