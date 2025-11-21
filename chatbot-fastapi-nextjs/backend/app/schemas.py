import uuid
from pydantic import BaseModel, Field
from fastapi_users import schemas

class Message(BaseModel):
    role: str = Field(default="user", description="The role of the message")
    content: str = Field(description="The content of the message")

class Chat(BaseModel):
    messages: list[Message]
    stream: bool = Field(default=True, description="Whether to stream the response")

class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass