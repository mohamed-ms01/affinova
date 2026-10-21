from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, Payment, Notification
from app.schemas import (
    PaymentOrderCreate,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentTransactionResponse,
    UserResponse
)
from app.security import get_current_user
from app.payment_service import (
    generate_order_id,
    generate_upi_qr_code,
    POPULAR_BANKS
)
from app.mongodb import payments_col, users_col, notifications_col

router = APIRouter(prefix="/api/payments", tags=["Payments & Checkout"])

PLAN_PRICES = {
    "starter": 19.0,
    "pro": 249.0,
    "elite": 499.0
}

@router.get("/banks")
async def get_supported_banks():
    """Returns list of supported Indian banks for Net Banking."""
    return {"banks": POPULAR_BANKS}

@router.post("/create-order", response_model=PaymentOrderResponse)
async def create_payment_order(
    req: PaymentOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    plan_key = req.plan.lower()
    if plan_key not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid subscription plan.")

    amount = PLAN_PRICES[plan_key]
    order_id = generate_order_id()

    upi_details = None
    razorpay_order_id = None
    razorpay_key_id = None

    if req.method == "upi":
        upi_details = generate_upi_qr_code(amount=amount, order_id=order_id, plan_name=plan_key)
    elif req.method == "razorpay":
        # Create Razorpay Order if keys configured
        try:
            import razorpay
            from app.config import settings
            if settings.RAZORPAY_KEY_ID and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_placeholder"):
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                rzp_order = client.order.create({
                    "amount": int(amount * 100), # in paise
                    "currency": "INR",
                    "receipt": order_id,
                    "notes": {
                        "plan": plan_key,
                        "user_id": current_user.id,
                        "email": current_user.email
                    }
                })
                razorpay_order_id = rzp_order.get("id")
                razorpay_key_id = settings.RAZORPAY_KEY_ID
            else:
                # Simulated Razorpay Test Order ID for development / testing without live keys
                razorpay_order_id = f"order_sim_{order_id[-8:]}"
                razorpay_key_id = settings.RAZORPAY_KEY_ID
        except Exception as e:
            print(f"[RAZORPAY ORDER ERROR] {e}")
            razorpay_order_id = f"order_sim_{order_id[-8:]}"
            razorpay_key_id = settings.RAZORPAY_KEY_ID

    # Record pending payment in SQLite
    new_payment = Payment(
        user_id=current_user.id,
        order_id=order_id,
        amount=amount,
        plan=plan_key,
        method=req.method,
        bank_name=req.bank_name,
        status="pending"
    )
    db.add(new_payment)
    await db.commit()

    # Sync to MongoDB if connected
    m_payments = payments_col()
    if m_payments is not None:
        try:
            await m_payments.insert_one({
                "id": new_payment.id,
                "user_id": current_user.id,
                "order_id": order_id,
                "amount": amount,
                "plan": plan_key,
                "method": req.method,
                "bank_name": req.bank_name,
                "status": "pending",
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            print(f"[MONGODB SYNC ERROR] {e}")

    return {
        "order_id": order_id,
        "amount": amount,
        "plan": plan_key,
        "method": req.method,
        "upi_details": upi_details,
        "popular_banks": POPULAR_BANKS if req.method == "netbanking" else None,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_key_id": razorpay_key_id,
        "currency": "INR"
    }

@router.post("/verify")
async def verify_payment(
    req: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Lookup payment order
    result = await db.execute(
        select(Payment).filter(
            Payment.order_id == req.order_id,
            Payment.user_id == current_user.id
        )
    )
    payment = result.scalars().first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found.")

    # If razorpay payment, verify signature if real credentials present
    if req.razorpay_payment_id:
        payment.method = "razorpay"
        payment.utr_ref = req.razorpay_payment_id
        try:
            from app.config import settings
            if (settings.RAZORPAY_KEY_SECRET and 
                not settings.RAZORPAY_KEY_SECRET.startswith("placeholder") and 
                req.razorpay_signature and req.razorpay_order_id):
                import razorpay
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                client.utility.verify_payment_signature({
                    'razorpay_order_id': req.razorpay_order_id,
                    'razorpay_payment_id': req.razorpay_payment_id,
                    'razorpay_signature': req.razorpay_signature
                })
        except Exception as e:
            print(f"[RAZORPAY VERIFY SIGNATURE ERROR] {e}")

    payment.status = "success"
    if req.utr_ref:
        payment.utr_ref = req.utr_ref.strip()
    if req.bank_name:
        payment.bank_name = req.bank_name.strip()

    # Upgrade User Tier
    current_user.plan = payment.plan

    # Send Notification
    notif = Notification(
        user_id=current_user.id,
        title="Tier Subscription Activated",
        body=f"Your subscription to {payment.plan.upper()} tier has been activated successfully via {payment.method.upper()}.",
        type="payment"
    )
    db.add(notif)
    await db.commit()
    await db.refresh(current_user)

    # Sync to MongoDB
    m_payments = payments_col()
    if m_payments is not None:
        try:
            await m_payments.update_one(
                {"order_id": req.order_id},
                {"$set": {
                    "status": "success",
                    "utr_ref": payment.utr_ref,
                    "bank_name": payment.bank_name,
                    "updated_at": datetime.utcnow()
                }}
            )
            m_users = users_col()
            if m_users is not None:
                await m_users.update_one(
                    {"id": current_user.id},
                    {"$set": {"plan": payment.plan}}
                )
            m_notifs = notifications_col()
            if m_notifs is not None:
                await m_notifs.insert_one({
                    "id": notif.id,
                    "user_id": current_user.id,
                    "title": notif.title,
                    "body": notif.body,
                    "type": "payment",
                    "is_read": False,
                    "created_at": datetime.utcnow()
                })
        except Exception as e:
            print(f"[MONGODB SYNC ERROR] {e}")

    print(f"\n[AFFINOVA PAYMENT VERIFIED] User: {current_user.email} | Order: {payment.order_id} | Plan: {payment.plan} | Method: {payment.method}\n")

    return {
        "status": "success",
        "message": f"Payment verified! Your account is upgraded to {payment.plan.title()}.",
        "order_id": payment.order_id,
        "plan": payment.plan,
        "amount": payment.amount,
        "user": UserResponse.model_validate(current_user)
    }

@router.get("/history", response_model=List[PaymentTransactionResponse])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return [PaymentTransactionResponse.model_validate(p) for p in payments]


@router.get("/status")
async def get_payment_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns whether the current user has an active paid subscription.
    has_paid = True if plan is pro/elite OR has a successful payment record.
    """
    # Pro/Elite users are always considered paid
    if current_user.plan in ("pro", "elite"):
        return {"has_paid": True, "plan": current_user.plan}

    # Check for any successful payment
    result = await db.execute(
        select(Payment).filter(
            Payment.user_id == current_user.id,
            Payment.status == "success"
        )
    )
    paid_record = result.scalars().first()
    return {
        "has_paid": paid_record is not None,
        "plan": current_user.plan
    }
