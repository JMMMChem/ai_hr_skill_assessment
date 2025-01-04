from fastapi import HTTPException

import settings
import datetime

from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    try:
        # Remove detailed debug logging
        # print("\nDetailed password verification:")
        # print(f"Plain password type: {type(plain_password)}")
        # print(f"Hashed password type: {type(hashed_password)}")
        # print(f"Plain password length: {len(plain_password)}")
        # print(f"Hashed password length: {len(hashed_password)}")
        # print(f"Plain password: {plain_password}")
        # print(f"Hashed password: {hashed_password}")
        
        # Verify the password
        is_valid = pwd_context.verify(plain_password, hashed_password)
        # print(f"Verification result: {is_valid}")
        
        return is_valid
    except Exception as e:
        # print(f"Error in password verification: {str(e)}")
        return False


def hash_password(password):
    return pwd_context.hash(password)


def create_access_token(user_id: int, expires_delta: datetime.timedelta):
    return jwt.encode({
        "sub": str(user_id),
        "exp": (datetime.datetime.utcnow() + expires_delta).replace(hour=4)  # Expire at 4AM
    }, algorithm=settings.JWT_ALGORITHM, key=settings.JWT_SECRET_KEY)


def decode_access_token(token: str):
    try:
        return jwt.decode(token, key=settings.JWT_SECRET_KEY, algorithms=settings.JWT_ALGORITHM)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
