from fastapi import FastAPI, WebSocket

app = FastAPI()
connections = []


@app.websocket('/ws')
async def chat(ws: WebSocket):
    await ws.accept()
    connections.append(ws)

    while True:
        msg = await ws.receive_text()
        for c in list(connections):
            await c.send_text(msg)
