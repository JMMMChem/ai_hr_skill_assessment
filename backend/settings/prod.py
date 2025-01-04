import os

#
#
#   Production settings
#
#

from .base import *  # noqa
# Database URL
DATABASE_URL = os.environ.get("DATABASE_URL")

# OpenAI API Key
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
ENV = "production"
APP_NAME = "Raytell"

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND")

REDIS_URL = os.environ.get("REDIS_URL")

JWT_SECRET_KEY = "CHANGEME"

