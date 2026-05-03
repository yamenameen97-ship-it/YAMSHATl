from fastapi import FastAPI

app = FastAPI()


@app.get('/profile/{user_id}')
def profile(user_id: int):
    return {
        'id': user_id,
        'name': 'User',
        'followers': 0,
    }
