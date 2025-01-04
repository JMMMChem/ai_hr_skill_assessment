from typing import List
from fastapi import HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
import models
import schema
from fastapi import APIRouter
from database import get_db
from dependencies import get_current_user, logged_in
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations_training",
                   tags=["ConversationsTraining"],
                   dependencies=[
                        Depends(logged_in)
                    ]
                   )


@router.get("/", response_model=List[schema.ConversationTraining])
def get_conversations(db: Session = Depends(get_db),
                      user=Depends(get_current_user)):

    teams = db.query(models.Team).filter(models.Team.users.any(id=user.id)).all()
    conversation = db.query(models.ConversationTraining).filter(
        models.ConversationTraining.team_id.in_([team.id for team in teams])).all()

    return conversation


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=schema.ConversationTraining
)
def create_conversation(conversation: schema.CreateConversationTraining, db: Session = Depends(get_db)):
    new_conversation = models.ConversationTraining(**conversation.dict())
    print("NEW CONVERSATION", new_conversation)
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)

    return new_conversation


@router.get("/{id}", response_model=schema.ConversationTraining, status_code=status.HTTP_200_OK)
def get_conversation(id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.ConversationTraining).filter(models.ConversationTraining.id == id).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    return conversation


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.ConversationTraining).filter(models.ConversationTraining.id == id)

    if conversation.first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    db.query(models.MessageTraining).filter(models.MessageTraining.conversation_training_id == id).delete(synchronize_session=False)

    conversation.delete(synchronize_session=False)
    db.commit()

    return


@router.put("/{id}", response_model=schema.UpdateConversationTrainingTitle, status_code=status.HTTP_200_OK)
def modify_chat_title(id: int, request: schema.UpdateConversationTrainingTitle, db: Session = Depends(get_db)):
    conversation = db.query(models.ConversationTraining).filter(models.ConversationTraining.id == id).first()

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    conversation.title = request.title
    db.commit()
    db.refresh(conversation)

    return conversation


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(models.ConversationTraining).filter(models.ConversationTraining.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation.messages_training
