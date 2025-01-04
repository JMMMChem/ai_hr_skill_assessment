from database import Base, engine
from sqlalchemy import Column, Integer, String, TIMESTAMP, text, ForeignKey, Boolean, Table, Text, Enum
from sqlalchemy.orm import relationship
from enums import RoleType


team_membership = Table('team_membership', Base.metadata,
                        Column('user_id', Integer, ForeignKey('users.id')),
                        Column('team_id', Integer, ForeignKey('teams.id')))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    is_admin = Column(Boolean, server_default='FALSE')
    teams = relationship("Team", secondary=team_membership, back_populates="users")
    # posts = relationship("Post", back_populates="user")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # relationships
    users = relationship("User", secondary=team_membership, back_populates="teams")
    assistants = relationship("Assistant", back_populates="team")
    conversations = relationship("Conversation", back_populates="team")
    conversations_training = relationship("ConversationTraining", back_populates="team")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    # user_id = Column(ForeignKey("users.id"))


class Assistant(Base):
    __tablename__ = "assistants"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    chroma_db_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    team_id = Column(ForeignKey("teams.id"))
    team = relationship("Team", back_populates="assistants")
    documents = relationship("Document", back_populates="assistant")
    conversations = relationship("Conversation", back_populates="assistant")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    path_url = Column(String, nullable=False)
    assistant_id = Column(ForeignKey("assistants.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    updated = Column(Boolean, server_default='FALSE')

    assistant = relationship("Assistant", back_populates="documents")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    assistant_id = Column(ForeignKey("assistants.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    team_id = Column(ForeignKey("teams.id"))

    team = relationship("Team", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")
    assistant = relationship("Assistant", back_populates="conversations")

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    conversations_training = relationship("ConversationTraining", back_populates="character")

class ConversationTraining(Base):
    __tablename__ = "conversations_training"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(String, nullable=False)
    character_id = Column(ForeignKey("characters.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    team_id = Column(ForeignKey("teams.id"))
    
    team = relationship("Team", back_populates="conversations_training")
    messages_training = relationship("MessageTraining", back_populates="conversation_training")
    character = relationship("Character", back_populates="conversations_training")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, nullable=False)
    content = Column(Text, nullable=False)
    role = Column(Enum(RoleType), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    conversation_id = Column(ForeignKey("conversations.id"))

    conversation = relationship("Conversation", back_populates="messages")

class MessageTraining(Base):
    __tablename__ = "messages_training"

    id = Column(Integer, primary_key=True, nullable=False)
    content = Column(Text, nullable=False)
    role = Column(Enum(RoleType), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    conversation_training_id = Column(ForeignKey("conversations_training.id"))

    conversation_training = relationship("ConversationTraining", back_populates="messages_training")


Base.metadata.create_all(bind=engine)
