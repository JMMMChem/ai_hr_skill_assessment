from typing import List
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from starlette import status
import models
import schema
from fastapi import APIRouter
from database import get_db
from tasks import hello_world
from dependencies import get_current_user, logged_in

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trainer_characters",
                   tags=["TrainerCharacters"], dependencies=[
                        Depends(logged_in)
                    ]
                   )


@router.get("/", response_model=List[schema.Character])
def get_characters(db: Session = Depends(get_db),
                   user=Depends(get_current_user)):

    # teams = db.query(models.Team).filter(models.Team.users.any(id=user.id)).all()
    character = db.query(models.Character).all()
    logger.warning(f"CHARACTERS: {character}")

    return character
