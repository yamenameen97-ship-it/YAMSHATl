from fastapi import APIRouter

router = APIRouter()


@router.get('/')
def search(q: str):
    return {
        'query': q,
        'results': [],
    }
