
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY","secret")
UPLOAD_FOLDER = "uploads"
MAX_CONTENT_LENGTH = 50 * 1024 * 1024
