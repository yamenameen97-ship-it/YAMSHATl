
from collections import deque
from backend.core.logger import get_logger

logger = get_logger(__name__)

class MessageQueue:
    def __init__(self):
        self.queue = deque()

    def add_message(self, message: dict):
        self.queue.append(message)
        logger.info(f"Message added to queue: {message.get('id')}")

    def get_message(self) -> dict or None:
        if self.queue:
            message = self.queue.popleft()
            logger.info(f"Message retrieved from queue: {message.get('id')}")
            return message
        return None

    def __len__(self):
        return len(self.queue)

message_queue = MessageQueue()
