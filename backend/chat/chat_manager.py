
from backend.core.logger import get_logger
from backend.chat.message_queue import message_queue
import asyncio
import time

logger = get_logger(__name__)

class ChatManager:
    def __init__(self):
        self.active_connections = {}
        self.message_delivery_status = {}

    async def connect(self, websocket, user_id: str):
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected.")
        # Simulate reconnect state sync
        await self.sync_user_state(user_id)

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected.")

    async def send_message(self, sender_id: str, receiver_id: str, message_content: str):
        message_id = f"msg_{int(time.time())}_{sender_id}_{receiver_id}"
        message = {
            "id": message_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": message_content,
            "timestamp": time.time(),
            "delivered": False
        }
        message_queue.add_message(message)
        self.message_delivery_status[message_id] = {"delivered": False, "retries": 0}
        logger.info(f"Message {message_id} queued for delivery from {sender_id} to {receiver_id}.")
        await self.process_message_queue()
        return message

    async def process_message_queue(self):
        while len(message_queue) > 0:
            message = message_queue.get_message()
            if message:
                await self.deliver_message(message)
            await asyncio.sleep(0.1) # Small delay to prevent busy-waiting

    async def deliver_message(self, message: dict):
        receiver_id = message["receiver_id"]
        message_id = message["id"]
        if receiver_id in self.active_connections:
            websocket = self.active_connections[receiver_id]
            try:
                await websocket.send_json(message)
                self.message_delivery_status[message_id]["delivered"] = True
                logger.info(f"Message {message_id} delivered to {receiver_id}.")
            except Exception as e:
                logger.error(f"Failed to deliver message {message_id} to {receiver_id}: {e}")
                await self.retry_message_delivery(message)
        else:
            logger.warning(f"Receiver {receiver_id} not connected. Retrying message {message_id} later.")
            await self.retry_message_delivery(message)

    async def retry_message_delivery(self, message: dict):
        message_id = message["id"]
        self.message_delivery_status[message_id]["retries"] += 1
        if self.message_delivery_status[message_id]["retries"] < 3: # Max 3 retries
            await asyncio.sleep(2 ** self.message_delivery_status[message_id]["retries"]) # Exponential backoff
            message_queue.add_message(message) # Re-add to queue for retry
            logger.info(f"Retrying message {message_id}. Attempt {self.message_delivery_status[message_id]["retries"]}.")
        else:
            logger.error(f"Message {message_id} failed after multiple retries. Marking as undeliverable.")
            # Here you might store it in a dead-letter queue or notify sender

    async def sync_user_state(self, user_id: str):
        # In a real application, this would fetch missed messages or chat history from DB
        logger.info(f"Syncing state for user {user_id}. (Placeholder: fetch missed messages/history)")
        # Example: send any undelivered messages for this user
        # for msg_id, status in self.message_delivery_status.items():
        #     if not status["delivered"] and self.message_delivery_status[msg_id]["receiver_id"] == user_id:
        #         # Re-add to queue or send directly
        #         pass

chat_manager = ChatManager()
