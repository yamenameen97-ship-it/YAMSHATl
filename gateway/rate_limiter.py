import os
from typing import Any

import redis

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

RATE_LIMIT_RULES = {
    '/api/auth/login': {'capacity': 5, 'refill_rate': 1 / 12},
    '/api/auth/register': {'capacity': 5, 'refill_rate': 1 / 12},
    '/api/chat/messages': {'capacity': 10, 'refill_rate': 1},
    '/api/posts': {'capacity': 20, 'refill_rate': 1},
    '/api/comments': {'capacity': 15, 'refill_rate': 1},
    'default': {'capacity': 30, 'refill_rate': 1},
}

TOKEN_BUCKET_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refill_rate = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'last')
local tokens = tonumber(data[1])
local last = tonumber(data[2])

if tokens == nil then
  tokens = capacity
  last = now
end

tokens = math.min(capacity, tokens + ((now - last) * refill_rate))
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'last', now)
redis.call('EXPIRE', key, ttl)
return {allowed, tokens}
"""


def resolve_rule(path: str) -> dict[str, Any]:
    for prefix, rule in RATE_LIMIT_RULES.items():
        if prefix != 'default' and path.startswith(prefix):
            return rule
    return RATE_LIMIT_RULES['default']


def bucket_key(identifier: str, path: str) -> str:
    normalized_path = path.replace('/', ':') or 'root'
    return f'rate_limit:{identifier}:{normalized_path}'


def consume(identifier: str, path: str, now: float) -> tuple[bool, int, int]:
    rule = resolve_rule(path)
    key = bucket_key(identifier, path)
    allowed, remaining = redis_client.eval(
        TOKEN_BUCKET_LUA,
        1,
        key,
        now,
        rule['capacity'],
        rule['refill_rate'],
        120,
    )
    remaining_int = max(0, int(float(remaining)))
    return bool(int(allowed)), int(rule['capacity']), remaining_int
