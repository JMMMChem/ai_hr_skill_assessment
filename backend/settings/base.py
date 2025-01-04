#
#
#   Base settings
#
#
import os
import datetime

LLM_URL = "localhost:8000"
LLM_NAME = "llama3:8b"
EMBEDDING_MODEL_NAME = "mxbai-embed-large"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 150
TEMPERATURE = 0.7


FRONTEND_DIST_DIR = os.path.join("..", "frontend", "dist")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DELTA = datetime.timedelta(days=30)