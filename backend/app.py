import api.conversation
import api.conversation_training
import api.trainer_characters
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
import os
import settings
import api

app = FastAPI(debug=settings.ENV == "development")

templates = Jinja2Templates(directory=settings.FRONTEND_DIST_DIR)
app.mount("/static", StaticFiles(directory=settings.FRONTEND_DIST_DIR), name="static")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.posts.router)
app.include_router(api.chatbot.router)
app.include_router(api.rag.router)
app.include_router(api.documents.router)
app.include_router(api.auth.router)
app.include_router(api.conversation.router)
app.include_router(api.conversation_training.router)
app.include_router(api.teams.router)
app.include_router(api.trainer_characters.router)


# WARNING: KEEP this route always at the bottom
@app.get("/{full_path:path}")
def read_index():
    return FileResponse(os.path.join(settings.FRONTEND_DIST_DIR, "index.html"))
