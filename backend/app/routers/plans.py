from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import PlanSubscribe, UserResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/plans", tags=["Plans"])

@router.post("/subscribe", response_model=UserResponse)
async def subscribe_plan(
    data: PlanSubscribe,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    valid_plans = ["starter", "pro", "elite"]
    plan = data.plan.lower()
    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")

    current_user.plan = plan
    await db.commit()
    await db.refresh(current_user)

    print(f"\n[AFFINOVA SUBSCRIPTION] User: {current_user.email} updated tier to {plan.upper()}\n")
    return UserResponse.model_validate(current_user)
