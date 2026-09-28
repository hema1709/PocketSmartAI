from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.planner import HomeRequest, JewelryRequest, PartyRequest
from app.security import get_current_user
from app.services.recommendation_service import ai_recommend

router = APIRouter(tags=["Planners"])


def save_result(db, user, planner_type, request_data, result, ai_used):
    rec = Recommendation(
        user_id=user.id,
        planner_type=planner_type,
        request_data=request_data,
        result_data={**result, "ai_used": ai_used},
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/generate-home")
def generate_home(
    payload: HomeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    result, ai_used = ai_recommend("home", data)
    rec = save_result(db, current_user, "home", data, result, ai_used)
    return {"id": rec.id, "planner_type": "home", **result, "budget": payload.budget, "ai_used": ai_used}


@router.post("/generate-party")
def generate_party(
    payload: PartyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    result, ai_used = ai_recommend("party", data)
    rec = save_result(db, current_user, "party", data, result, ai_used)
    return {"id": rec.id, "planner_type": "party", **result, "budget": payload.budget, "ai_used": ai_used}


@router.post("/generate-jewelry")
async def generate_jewelry(
    budget: Annotated[float, Form(gt=0, le=10_000_000)],
    occasion: Annotated[str, Form(min_length=1, max_length=80)],
    style: Annotated[str, Form(max_length=80)] = "elegant",
    outfit_color: Annotated[str, Form(max_length=80)] = "",
    notes: Annotated[str, Form(max_length=500)] = "",
    image: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_bytes = None
    mime_type = None
    if image:
        allowed = {"image/jpeg", "image/png", "image/webp"}
        if image.content_type not in allowed:
            raise HTTPException(status_code=400, detail="Image must be JPEG, PNG, or WEBP.")
        image_bytes = await image.read()
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image is larger than 5 MB.")
        mime_type = image.content_type

    data = JewelryRequest(
        budget=budget, occasion=occasion, style=style,
        outfit_color=outfit_color, notes=notes
    ).model_dump()

    result, ai_used = ai_recommend("jewelry", data, image_bytes, mime_type)
    rec = save_result(db, current_user, "jewelry", data, result, ai_used)
    return {"id": rec.id, "planner_type": "jewelry", **result, "budget": budget, "ai_used": ai_used}
