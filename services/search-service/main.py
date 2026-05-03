from fastapi import FastAPI

app = FastAPI()


@app.get('/search')
def search(q: str):
    return {
        'query': q,
        'results': [],
    }
