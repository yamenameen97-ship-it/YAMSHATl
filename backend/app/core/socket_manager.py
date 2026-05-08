from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> bool:
        await websocket.accept()
        connections = self.active_connections.setdefault(user_id, [])
        connections.append(websocket)
        return len(connections) == 1

    def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        connections = self.active_connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and user_id in self.active_connections:
            del self.active_connections[user_id]
            return True
        return False

    def is_online(self, user_id: int) -> bool:
        return bool(self.active_connections.get(user_id))

    def online_users(self) -> list[int]:
        return list(self.active_connections.keys())

    async def send_to_user(self, user_id: int, data: dict) -> None:
        stale_connections: list[WebSocket] = []
        for connection in list(self.active_connections.get(user_id, [])):
            try:
                await connection.send_json(data)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(user_id, connection)

    async def broadcast(self, data: dict) -> None:
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, data)


manager = ConnectionManager()
