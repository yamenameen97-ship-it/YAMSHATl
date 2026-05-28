
from fastapi import Request, HTTPException, status
from collections import defaultdict
import time
from backend.core.errors import ErrorCode, APIException
from backend.core.logger import get_logger

logger = get_logger(__name__)

# Simple in-memory store for rate limiting and brute force protection
# In a real application, this would be a persistent store like Redis
request_counts = defaultdict(lambda: defaultdict(int))
last_request_time = defaultdict(lambda: defaultdict(float))
blocked_ips = defaultdict(float)

RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 100
BRUTE_FORCE_ATTEMPTS = 5
BRUTE_FORCE_BLOCK_TIME = 300  # seconds
IP_THROTTLE_LIMIT = 1000 # requests per hour
IP_THROTTLE_WINDOW = 3600 # seconds

async def rate_limiter(request: Request):
    ip = request.client.host

    # Check if IP is blocked due to brute force
    if ip in blocked_ips and blocked_ips[ip] > time.time():
        raise APIException(
            code=ErrorCode.BRUTE_FORCE_DETECTED,
            message="Too many failed attempts. Please try again later.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )

    current_time = time.time()

    # Rate limiting per IP
    if current_time - last_request_time[ip]["rate_limit"] > RATE_LIMIT_WINDOW:
        request_counts[ip]["rate_limit"] = 1
        last_request_time[ip]["rate_limit"] = current_time
    else:
        request_counts[ip]["rate_limit"] += 1
        if request_counts[ip]["rate_limit"] > MAX_REQUESTS_PER_WINDOW:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            raise APIException(
                code=ErrorCode.RATE_LIMIT_EXCEEDED,
                message="Too many requests. Please try again later.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

    # IP throttling (long-term)
    if current_time - last_request_time[ip]["ip_throttle"] > IP_THROTTLE_WINDOW:
        request_counts[ip]["ip_throttle"] = 1
        last_request_time[ip]["ip_throttle"] = current_time
    else:
        request_counts[ip]["ip_throttle"] += 1
        if request_counts[ip]["ip_throttle"] > IP_THROTTLE_LIMIT:
            logger.warning(f"IP throttled for IP: {ip}")
            raise APIException(
                code=ErrorCode.RATE_LIMIT_EXCEEDED,
                message="IP throttled. Too many requests over a long period.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

async def brute_force_protector(request: Request, username: str = None):
    ip = request.client.host
    if username:
        key = f"{ip}-{username}"
    else:
        key = ip

    current_time = time.time()

    if current_time - last_request_time[key]["brute_force"] > BRUTE_FORCE_BLOCK_TIME:
        request_counts[key]["brute_force"] = 1
        last_request_time[key]["brute_force"] = current_time
    else:
        request_counts[key]["brute_force"] += 1
        if request_counts[key]["brute_force"] > BRUTE_FORCE_ATTEMPTS:
            blocked_ips[ip] = current_time + BRUTE_FORCE_BLOCK_TIME
            logger.error(f"Brute force detected and IP blocked: {ip}")
            raise APIException(
                code=ErrorCode.BRUTE_FORCE_DETECTED,
                message="Too many failed attempts. Your IP has been temporarily blocked.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )


# Placeholder for suspicious activity detection
async def suspicious_activity_detector(request: Request):
    # Implement logic to detect unusual patterns, e.g., login from new device/location
    pass

# Placeholder for device/session tracking
async def device_session_tracker(request: Request):
    # Implement logic to track devices and sessions
    pass
