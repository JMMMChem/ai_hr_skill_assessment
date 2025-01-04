from typing import List
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from starlette import status

import models
import schema
import settings

from fastapi import APIRouter, Depends
from database import get_db
from .auth_utils import verify_password, create_access_token, hash_password
from dependencies import get_current_user
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=schema.LoginResponse)
def login(login: schema.Login, db: Session = Depends(get_db)):
    # Add debug logging
    print(f"Attempting login for email: {login.email}")
    
    user = db.query(models.User).filter(models.User.email == login.email).first()

    if user is None:
        print("User not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Add debug logging for password verification
    is_valid = verify_password(login.password, user.password)
    print(f"Password verification result: {is_valid}")

    if not is_valid:
        print("Invalid password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        user_id=user.id,
        expires_delta=settings.JWT_EXPIRE_DELTA
    )

    return schema.LoginResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/register", response_model=schema.User)
def register(user: schema.CreateUser, db: Session = Depends(get_db)):

    if user.password != user.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match"
        )

    # Create new user
    new_user = models.User(
        name=user.name,
        email=user.email,
        is_admin=False
    )
    new_user.password = hash_password(user.password)

    # Create a new team for this user
    new_team = models.Team(
        name=f"{user.name}'s Team",
        description=f"Personal workspace for {user.name}"
    )
    db.add(new_team)
    db.flush()  # This assigns an ID to the team

    # Assign user to their new team
    new_user.teams.append(new_team)

    db.add(new_user)
    db.commit()
    
    # Refresh the user with teams relationship loaded
    db.refresh(new_user)
    user_with_teams = db.query(models.User).options(
        joinedload(models.User.teams)
    ).filter(models.User.id == new_user.id).first()

    return user_with_teams


@router.get("/me", response_model=schema.User)
def get_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch the user with teams relationship loaded
    user_with_teams = db.query(models.User).options(
        joinedload(models.User.teams)
    ).filter(models.User.id == user.id).first()
    
    if user_with_teams is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user_with_teams


@router.post("/test-user-with-team")
def create_test_user(db: Session = Depends(get_db)):
    # First, delete existing test user if exists
    db.query(models.User).filter(models.User.email == "test@example.com").delete()
    
    # Create new test user with known credentials
    test_user = models.User(
        name="Test User",
        email="test@example.com",
        is_admin=False
    )
    
    # We know this password is "testpass123"
    test_user.password = hash_password("testpass123")
    
    # Create a team for the test user
    test_team = models.Team(
        name="Test Team",
        description="Test Team Description"
    )
    db.add(test_team)
    db.flush()
    
    # Assign user to team
    test_user.teams.append(test_team)
    
    db.add(test_user)
    db.commit()
    
    return {
        "message": "Test user created", 
        "credentials": {
            "email": "test@example.com",
            "password": "testpass123"  # The actual password you should use to login
        }
    }
