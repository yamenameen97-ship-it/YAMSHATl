
from backend.core.logger import get_logger
import asyncio
import time

logger = get_logger(__name__)

class StreamManager:
    def __init__(self):
        self.active_streams = {}
        self.stream_heartbeats = {}
        self.stream_moderators = {}

    async def start_stream(self, stream_id: str, user_id: str):
        if stream_id in self.active_streams:
            logger.warning(f"Stream {stream_id} already active.")
            return False
        self.active_streams[stream_id] = {"user_id": user_id, "viewers": set(), "start_time": time.time()}
        self.stream_heartbeats[stream_id] = time.time()
        logger.info(f"Stream {stream_id} started by user {user_id}.")
        return True

    async def stop_stream(self, stream_id: str):
        if stream_id in self.active_streams:
            del self.active_streams[stream_id]
            if stream_id in self.stream_heartbeats:
                del self.stream_heartbeats[stream_id]
            logger.info(f"Stream {stream_id} stopped.")
            return True
        logger.warning(f"Stream {stream_id} not found.")
        return False

    async def join_stream(self, stream_id: str, viewer_id: str):
        if stream_id in self.active_streams:
            self.active_streams[stream_id]["viewers"].add(viewer_id)
            logger.info(f"Viewer {viewer_id} joined stream {stream_id}.")
            return True
        logger.warning(f"Stream {stream_id} not found for viewer {viewer_id}.")
        return False

    async def leave_stream(self, stream_id: str, viewer_id: str):
        if stream_id in self.active_streams and viewer_id in self.active_streams[stream_id]["viewers"]:
            self.active_streams[stream_id]["viewers"].remove(viewer_id)
            logger.info(f"Viewer {viewer_id} left stream {stream_id}.")
            return True
        logger.warning(f"Viewer {viewer_id} not in stream {stream_id}.")
        return False

    async def stream_heartbeat(self, stream_id: str):
        if stream_id in self.stream_heartbeats:
            self.stream_heartbeats[stream_id] = time.time()
            logger.debug(f"Heartbeat received for stream {stream_id}.")
            return True
        logger.warning(f"Heartbeat for unknown stream {stream_id}.")
        return False

    async def check_stream_health(self, timeout: int = 30):
        """Checks for inactive streams and cleans them up."""
        current_time = time.time()
        streams_to_cleanup = []
        for stream_id, last_heartbeat in self.stream_heartbeats.items():
            if current_time - last_heartbeat > timeout:
                streams_to_cleanup.append(stream_id)
        
        for stream_id in streams_to_cleanup:
            logger.warning(f"Stream {stream_id} timed out. Cleaning up.")
            await self.stop_stream(stream_id)
            # Also handle 'ghost room cleanup' here, e.g., notify clients, remove from discovery
            logger.info(f"Ghost room cleanup for stream {stream_id} completed.")

    async def moderate_stream(self, stream_id: str, moderator_id: str, action: str, target_user_id: str = None):
        # Placeholder for moderation logic (e.g., kick user, mute, ban)
        logger.info(f"Moderator {moderator_id} performing {action} on stream {stream_id} for user {target_user_id or 'N/A'}.")
        # In a real system, this would interact with the streaming platform's API

    async def reconnect_recovery(self, stream_id: str, user_id: str):
        # Logic to help a user reconnect to a stream and sync state
        logger.info(f"Attempting reconnect recovery for user {user_id} on stream {stream_id}.")
        if stream_id in self.active_streams:
            # Re-add user to viewers, potentially send missed messages/events
            self.active_streams[stream_id]["viewers"].add(user_id)
            logger.info(f"User {user_id} reconnected to stream {stream_id}.")
            return True
        logger.warning(f"Stream {stream_id} not active for reconnect recovery of user {user_id}.")
        return False

stream_manager = StreamManager()
