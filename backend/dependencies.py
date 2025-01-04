import models

from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from starlette import status

from database import Session
from api.auth_utils import decode_access_token
from models import User
from database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def logged_in(token: Annotated[str, Depends(oauth2_scheme)]):
    decode_access_token(token)
    return True

def get_user(user_id: int, db: Session = Depends(get_db)) -> models.User:
    user = db.query(User).get(user_id)
    return user


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> models.User:
    claim = decode_access_token(token)
    user = db.query(User).get(int(claim["sub"]))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
