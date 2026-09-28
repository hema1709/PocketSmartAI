from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recommendation import Recommendation
from app.models.user import User
from app.security import get_current_user

router = APIRouter(tags=["History"])


@router.get("/history")
def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Recommendation)
        .where(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
    ).all()

    return [
        {
            "id": row.id,
            "planner_type": row.planner_type,
            "created_at": row.created_at.isoformat(),
            "request_data": row.request_data,
            "result_data": row.result_data,
        }
        for row in rows
    ]


@router.get("/recommendations-details/{recommendation_id}")
def recommendation_details(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.get(Recommendation, recommendation_id)
    if not row or row.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
    return {
        "id": row.id,
        "planner_type": row.planner_type,
        "request_data": row.request_data,
        "result_data": row.result_data,
        "created_at": row.created_at.isoformat(),
    }
