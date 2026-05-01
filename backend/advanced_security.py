
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

security_admin_bp = Blueprint("security_admin", __name__)
logger = logging.getLogger(__name__)

REQUEST_CACHE = defaultdict(list)
BLOCKED_IPS = set()
SUSPICIOUS_PATHS = ["/wp-admin", "/phpmyadmin", ".env", "adminer"]

MAX_REQUESTS_PER_MINUTE = 120


def register_security_hooks(app):
    @app.before_request
    def firewall_guard():
        ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")

        if ip in BLOCKED_IPS:
            return jsonify({"error": "access blocked"}), 403

        for bad in SUSPICIOUS_PATHS:
            if bad.lower() in request.path.lower():
                BLOCKED_IPS.add(ip)
                logger.warning("Blocked suspicious request from %s to %s", ip, request.path)
                return jsonify({"error": "suspicious activity detected"}), 403

        now = datetime.utcnow()
        REQUEST_CACHE[ip] = [
            t for t in REQUEST_CACHE[ip]
            if now - t < timedelta(minutes=1)
        ]
        REQUEST_CACHE[ip].append(now)

        if len(REQUEST_CACHE[ip]) > MAX_REQUESTS_PER_MINUTE:
            BLOCKED_IPS.add(ip)
            logger.warning("Rate limit block for %s", ip)
            return jsonify({"error": "too many requests"}), 429


@security_admin_bp.get("/security/dashboard")
def security_dashboard():
    return jsonify({
        "blocked_ips": list(BLOCKED_IPS),
        "active_rate_limit_entries": len(REQUEST_CACHE),
        "status": "secured"
    })
