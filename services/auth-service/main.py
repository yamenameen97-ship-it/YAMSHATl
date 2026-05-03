from datetime import datetime, timedelta, timezone

import jwt
from fastapi import FastAPI

app = FastAPI()

SECRET = 'supersecret'


@app.post('/login')
def login(user: str):
    token = jwt.encode(
        {
            'user': user,
            'exp': datetime.now(timezone.utc) + timedelta(hours=1),
        },
        SECRET,
        algorithm='HS256',
    )
    return {'token': token}
