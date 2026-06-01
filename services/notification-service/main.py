from fastapi import FastAPI

app = FastAPI()


@app.post('/notify')
def notify(user: str, msg: str):
    print(f'Notify {user}: {msg}')
    return {'sent': True}
