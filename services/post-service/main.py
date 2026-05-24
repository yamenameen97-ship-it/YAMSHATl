from fastapi import FastAPI

app = FastAPI()
posts = []


@app.post('/')
def create_post(text: str):
    posts.append({'text': text})
    return {'msg': 'created'}


@app.get('/')
def get_posts():
    return posts
