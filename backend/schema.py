from pydantic import BaseModel
import datetime
from typing import List
from enums import ResponseType

class Login(BaseModel):
    email: str
    password: str

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class Team(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True


class User(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    teams: List[Team]

    class Config:
        from_attributes = True


class CreateUser(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str

    class Config:
        from_attributes = True


class TableItemResponse(BaseModel):
    value: str
    date: datetime.date


class PlotItemResponse(BaseModel):
    value: str
    date: datetime.date


class ChatBotResponse(BaseModel):
    type: ResponseType
    data: List[PlotItemResponse]


class PostBase(BaseModel):
    content: str
    title: str
    # published: bool
    # n_likes: int

    class Config:
        from_attributes = True


class CreatePost(PostBase):
    class Config:
        from_attributes = True


class Assistant(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True


class Character(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True


class UpdateChromaDb(BaseModel):
    id: int

    class Config:
        from_attributes = True


class QnaAssistant(BaseModel):
    question: str
    conversation_id: int

    class Config:
        from_attributes = True

class TrainingQnaAssistant(BaseModel):
    question: str
    conversation_id: int

    class Config:
        from_attributes = True

class CreateAssistant(BaseModel):
    name: str
    description: str
    team_id: int

    class Config:
        from_attributes = True


class UpdateAssistant(BaseModel):
    name: str
    description: str

    class Config:
        from_attributes = True


class Document(BaseModel):
    id: int
    title: str
    path_url: str
    assistant: Assistant

    class Config:
        from_attributes = True


class CreateDocument(BaseModel):
    title: str
    path_url: str
    assistant_id: int

    class Config:
        from_attributes = True


class UpdateDocument(BaseModel):
    title: str
    path_url: str
    assistant: Assistant

    class Config:
        from_attributes = True


class Conversation(BaseModel):
    id: int
    title: str
    team_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CreateConversation(BaseModel):

    title: str
    team_id: int
    assistant_id: int

    class Config:
        from_attributes = True


class UpdateConversationTitle(BaseModel):
    title: str

    class Config:
        from_attributes = True


class ConversationTraining(BaseModel):
    id: int
    title: str
    team_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CreateConversationTraining(BaseModel):

    title: str
    team_id: int
    character_id: int
    
    class Config:
        from_attributes = True


class UpdateConversationTrainingTitle(BaseModel):
    title: str

    class Config:
        from_attributes = True


class Message(BaseModel):
    id: int
    content: str
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class MessageTraining(BaseModel):
    id: int
    content: str
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Team(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True


class CreateTeam(BaseModel):
    name: str
    description: str

    class Config:
        from_attributes = True
