import os

import cloudinary
import cloudinary.uploader


cloudinary.config(
    cloud_name=os.getenv('CLOUD_NAME'),
    api_key=os.getenv('CLOUD_API_KEY'),
    api_secret=os.getenv('CLOUD_API_SECRET'),
)


def upload_file(file_path: str):
    result = cloudinary.uploader.upload(file_path)
    return result.get('secure_url')
