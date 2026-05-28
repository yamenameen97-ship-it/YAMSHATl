
from celery import Celery

celery = Celery(__name__, broker="redis://redis:6379/0")

@celery.task
def background_log(msg):
    print("LOG:", msg)
