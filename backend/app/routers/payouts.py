from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, Payout
from app.schemas import PayoutCreate, PayoutResponse
from app.security import get_current_user
from app.email_service import send_payout_confirmation_email


router = APIRouter(prefix="/api/payouts", tags=["Payouts"])

@router.get("")
async def get_payouts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payout).filter(Payout.user_id == current_user.id).order_by(Payout.created_at.desc())
    )
    payouts = result.scalars().all()
    return {
        "available_balance": current_user.available_balance,
        "history": [PayoutResponse.model_validate(p) for p in payouts]
    }

@router.post("", response_model=PayoutResponse, status_code=status.HTTP_201_CREATED)
async def request_payout(
    payout_in: PayoutCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    MINIMUM_WITHDRAWAL = 1000.0
    if payout_in.amount < MINIMUM_WITHDRAWAL:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum withdrawal threshold is ₹1,000. Requested: ₹{payout_in.amount:,.2f}."
        )

    if payout_in.amount > current_user.available_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Requested amount (₹{payout_in.amount:,.2f}) exceeds your available balance (₹{current_user.available_balance:,.2f})."
        )

    # Deduct from available balance
    current_user.available_balance -= payout_in.amount

    new_payout = Payout(
        user_id=current_user.id,
        amount=payout_in.amount,
        method=payout_in.method,
        details=payout_in.details,
        status="Pending"
    )

    db.add(new_payout)
    await db.commit()
    await db.refresh(new_payout)

    print(f"\n[AFFINOVA PAYOUT REQUEST] User: {current_user.email} | Amount: {payout_in.amount} | Method: {payout_in.method}\n")

    # Send payout confirmation email
    send_payout_confirmation_email(
        current_user.email,
        current_user.full_name,
        payout_in.amount,
        payout_in.method
    )

    return PayoutResponse.model_validate(new_payout)
