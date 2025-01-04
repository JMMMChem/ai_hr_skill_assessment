from typing import List
from fastapi import HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
import models
import schema
from fastapi import APIRouter
from database import get_db
from tasks import hello_world
from dependencies import get_current_user, logged_in

router = APIRouter(prefix="/api/conversations",
                   tags=["Conversations"],
                   dependencies=[
                        Depends(logged_in)
                    ]
                   )


@router.get("/", response_model=List[schema.Conversation])
def get_conversations(db: Session = Depends(get_db),
                      user=Depends(get_current_user)):

    teams = db.query(models.Team).filter(models.Team.users.any(id=user.id)).all()
    conversation = db.query(models.Conversation).filter(
        models.Conversation.team_id.in_([team.id for team in teams])).all()

    return conversation


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=schema.Conversation
)
def create_conversation(conversation: schema.CreateConversation, db: Session = Depends(get_db)):
    new_conversation = models.Conversation(**conversation.dict())
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)

    return new_conversation


@router.get("/{id}", response_model=schema.Conversation, status_code=status.HTTP_200_OK)
def get_conversation(id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == id).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    return conversation


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == id)

    if conversation.first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )
    db.query(models.Message).filter(models.Message.conversation_id == id).delete(synchronize_session=False)

    conversation.delete(synchronize_session=False)
    db.commit()

    return

@router.put("/{id}", response_model=schema.UpdateConversationTitle, status_code=status.HTTP_200_OK)
def modify_chat_title(id: int, request: schema.UpdateConversationTitle, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == id).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    conversation.title = request.title
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("/{id}/messages", response_model=List[schema.Message])
def get_messages(id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == id).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    return conversation.messages
