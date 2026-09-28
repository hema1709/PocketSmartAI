from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse, UserResponse
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(or_(User.username == payload.username, User.email == payload.email)))
    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists.")

    user = User(
        username=payload.username,
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(username: str, password: str, db: Session):
    user = db.scalar(select(User).where(User.username == username))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password.")
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    return _login(username, password, db)


@router.post("/token", response_model=TokenResponse)
def token(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    return _login(username, password, db)


@router.post("/logout")
def logout():
    # Bearer JWTs are stateless; the client should discard its token.
    return {"message": "Logged out. Discard the access token on the client."}


@router.get("/session-info")
def session_info(current_user: User = Depends(get_current_user)):
    return {"logged_in": True, "user_id": current_user.id, "username": current_user.username}


@router.get("/session-data")
def session_data(current_user: User = Depends(get_current_user)):
    return {"user": {"id": current_user.id, "username": current_user.username, "email": current_user.email}}
