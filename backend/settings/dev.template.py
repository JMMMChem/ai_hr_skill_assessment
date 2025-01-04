from .base import *  # noqa
import os
from dotenv import load_dotenv

load_dotenv()

APP_URL = "http://localhost:8000"
ENV = "DEV"

# OpenAI API Key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

# Celery
CELERY_BROKER_URL = "redis://redis:6379/0"
CELERY_RESULT_BACKEND = "redis://redis:6379/0"

REDIS_URL = "redis://redis:6379/0"

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') 