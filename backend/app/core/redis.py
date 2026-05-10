import os

import redis
import os

# Check for Redis Cluster URL first
REDIS_CLUSTER_URL = os.getenv(\'REDIS_CLUSTER_URL\')
if REDIS_CLUSTER_URL:
    # Assuming redis-py-cluster or similar library is used for actual cluster connection
    # For simplicity, we'll use a regular Redis client for now, but in a real scenario,
    # this would be replaced with a RedisCluster client.
    print(\'Using Redis Cluster URL, but connecting with standard client for demonstration.\')
    redis_client = redis.Redis.from_url(
        REDIS_CLUSTER_URL,
        decode_responses=True,
    )
else:
    redis_client = redis.Redis.from_url(
        os.getenv(\'REDIS_URL\', \'redis://localhost:6379\'),
        decode_responses=True,
    )

# Example of how to check if it\'s a cluster (requires redis-py-cluster)
# try:
#     from redis.cluster import RedisCluster
#     if REDIS_CLUSTER_URL:
#         redis_client = RedisCluster.from_url(REDIS_CLUSTER_URL, decode_responses=True)
#     else:
#         redis_client = redis.Redis.from_url(os.getenv(\'REDIS_URL\', \'redis://localhost:6379\'), decode_responses=True)
# except ImportError:
#     print(\'redis-py-cluster not installed, falling back to standard Redis client.\')
#     redis_client = redis.Redis.from_url(os.getenv(\'REDIS_URL\', \'redis://localhost:6379\'), decode_responses=True)

