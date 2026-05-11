from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from backend.core.errors import APIException, ErrorCode
from backend.core.exception_handlers import api_exception_handler, http_exception_handler
from backend.core.logger import get_logger
import uuid

app = FastAPI()

logger = get_logger(__name__)

app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(Exception, http_exception_handler)


@app.get('/profile/{user_id}')
def profile(user_id: int):
    logger.info(f"Fetching profile for user_id: {user_id}")
    if user_id <= 0:
        raise APIException(code=ErrorCode.INVALID_INPUT, message="Invalid user ID", status_code=status.HTTP_400_BAD_REQUEST)
    # Simulate fetching user data
    if user_id == 1:
        return {
            'id': user_id,
            'name': 'User',
            'followers': 0,
        }
    else:
        raise APIException(code=ErrorCode.NOT_FOUND, message=f"User with ID {user_id} not found", status_code=status.HTTP_404_NOT_FOUND)

