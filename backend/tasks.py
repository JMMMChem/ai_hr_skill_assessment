#
#
#   Tasks
#
#

from celery import Celery
import settings


app = Celery(__name__)
app.conf.broker_url = settings.CELERY_BROKER_URL
app.conf.result_backend = settings.CELERY_RESULT_BACKEND
app.conf.broker_connection_retry_on_startup = True


@app.task(ignore_result=True)
def hello_world():
    print("Hello, world!")
    return "Hello, world!"

@app.task(ignore_result=True)
def create_chroma_db_instance():
    print("Creating ChromaDB instance")
    return "ChromaDB instance created"