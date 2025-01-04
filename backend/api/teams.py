from typing import List
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from starlette import status
import models
import schema
from fastapi import APIRouter
from database import get_db

from dependencies import get_current_user, logged_in

router = APIRouter(prefix="/api/teams",
                   tags=["Teams"], dependencies=[
                        Depends(logged_in)
                    ]
                   )


@router.get("/", response_model=List[schema.Team])
def get_teams(db: Session = Depends(get_db), user=Depends(get_current_user)):

    teams = db.query(models.Team).filter(models.Team.users.any(id=user.id)).all()

    return teams


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=schema.Team
)
def create_team(team: schema.CreateTeam, db: Session = Depends(get_db)):
    new_team = models.Team(**team.dict())
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team

@router.get("/{id}", response_model=schema.Team, status_code=status.HTTP_200_OK)
def get_team(id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == id).first()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    return team


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == id)

    if team.first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    team.delete(synchronize_session=False)
    db.commit()

    return


@router.put("/add_user_to_team/{id}", status_code=status.HTTP_200_OK)
def add_user_to_team(user_id, team_id, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The team id:{team_id} does not exist"
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The user id:{user_id} does not exist"
        )

    team.users.append(user)
    db.commit()

    return {"description": "User added to team"}

