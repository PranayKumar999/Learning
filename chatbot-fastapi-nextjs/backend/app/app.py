from fastapi import FastAPI
from .routers import chat
from contextlib import asynccontextmanager
from app.db import create_db_and_tables, get_async_session, User
from app.users import auth_backend, fastapi_users
from app.schemas import UserRead, UserCreate, UserUpdate

@asynccontextmanager
async def lifespan(app):
    await create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health", tags=["Index"])
def health():
    return {"status": "ok"}

app.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

app.include_router(chat.router, tags = ["Chat"])