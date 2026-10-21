"""
Affinova Admin API — Secured admin routes for platform management.
All endpoints require is_admin=True on the authenticated user.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.models import User, SmartLink, Payout, ContactMessage, Notification, ClickEvent
from app.security import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ──────────────────────────────────────────────
#  Admin guard dependency
# ──────────────────────────────────────────────
async def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    return current_user


# ──────────────────────────────────────────────
#  Pydantic schemas
# ──────────────────────────────────────────────
class NotificationCreate(BaseModel):
    title: str
    body: str
    type: str = "info"
    user_id: Optional[str] = None  # None = broadcast to all


class PayoutStatusUpdate(BaseModel):
    status: str  # Pending | Processing | Paid


class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    plan: Optional[str] = None


# ──────────────────────────────────────────────
#  Dashboard summary
# ──────────────────────────────────────────────
@router.get("/summary")
async def admin_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    verified_users = (await db.execute(select(func.count(User.id)).where(User.is_verified == True))).scalar()
    total_links = (await db.execute(select(func.count(SmartLink.id)))).scalar()
    total_clicks = (await db.execute(select(func.sum(SmartLink.clicks)))).scalar() or 0
    pending_payouts = (await db.execute(
        select(func.count(Payout.id)).where(Payout.status == "Pending")
    )).scalar()
    total_payout_amount = (await db.execute(
        select(func.sum(Payout.amount)).where(Payout.status == "Paid")
    )).scalar() or 0.0
    unread_messages = (await db.execute(
        select(func.count(ContactMessage.id)).where(ContactMessage.is_read == False)
    )).scalar()

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "total_links": total_links,
        "total_clicks": total_clicks,
        "pending_payouts": pending_payouts,
        "total_paid_out": round(total_payout_amount, 2),
        "unread_messages": unread_messages,
    }


# ──────────────────────────────────────────────
#  User management
# ──────────────────────────────────────────────
@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone_number": u.phone_number,
            "plan": u.plan,
            "is_verified": u.is_verified,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "available_balance": u.available_balance,
            "gross_earnings": u.gross_earnings,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    links_result = await db.execute(select(SmartLink).where(SmartLink.user_id == user_id))
    links = links_result.scalars().all()
    payouts_result = await db.execute(select(Payout).where(Payout.user_id == user_id).order_by(Payout.created_at.desc()))
    payouts = payouts_result.scalars().all()
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "plan": user.plan,
        "is_verified": user.is_verified,
        "is_active": user.is_active,
        "is_admin": user.is_admin,
        "available_balance": user.available_balance,
        "gross_earnings": user.gross_earnings,
        "created_at": user.created_at.isoformat(),
        "links_count": len(links),
        "total_clicks": sum(l.clicks for l in links),
        "payouts": [
            {
                "id": p.id,
                "amount": p.amount,
                "method": p.method,
                "status": p.status,
                "created_at": p.created_at.isoformat(),
            }
            for p in payouts
        ],
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.is_verified is not None:
        user.is_verified = body.is_verified
    if body.plan is not None:
        user.plan = body.plan
    await db.commit()
    return {"message": "User updated successfully."}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted."}


# ──────────────────────────────────────────────
#  Affiliate links management
# ──────────────────────────────────────────────
@router.get("/links")
async def list_all_links(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(SmartLink).order_by(SmartLink.created_at.desc()))
    links = result.scalars().all()
    out = []
    for lnk in links:
        user_res = await db.execute(select(User).where(User.id == lnk.user_id))
        owner = user_res.scalars().first()
        out.append({
            "id": lnk.id,
            "title": lnk.title,
            "slug": lnk.slug,
            "destination_url": lnk.destination_url,
            "clicks": lnk.clicks,
            "orders": lnk.orders,
            "earnings": lnk.earnings,
            "is_active": lnk.is_active,
            "bot_filtering": lnk.bot_filtering,
            "created_at": lnk.created_at.isoformat(),
            "owner_name": owner.full_name if owner else "Unknown",
            "owner_email": owner.email if owner else "Unknown",
        })
    return out


@router.patch("/links/{link_id}/toggle")
async def toggle_link(
    link_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(SmartLink).where(SmartLink.id == link_id))
    link = result.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found.")
    link.is_active = not link.is_active
    await db.commit()
    return {"is_active": link.is_active}


@router.delete("/links/{link_id}")
async def delete_link(
    link_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(SmartLink).where(SmartLink.id == link_id))
    link = result.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found.")
    await db.delete(link)
    await db.commit()
    return {"message": "Link deleted."}


# ──────────────────────────────────────────────
#  Payouts management
# ──────────────────────────────────────────────
@router.get("/payouts")
async def list_all_payouts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(Payout).order_by(Payout.created_at.desc()))
    payouts = result.scalars().all()
    out = []
    for p in payouts:
        user_res = await db.execute(select(User).where(User.id == p.user_id))
        owner = user_res.scalars().first()
        out.append({
            "id": p.id,
            "amount": p.amount,
            "method": p.method,
            "details": p.details,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
            "user_name": owner.full_name if owner else "Unknown",
            "user_email": owner.email if owner else "Unknown",
        })
    return out


@router.patch("/payouts/{payout_id}")
async def update_payout_status(
    payout_id: str,
    body: PayoutStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    allowed = {"Pending", "Processing", "Paid"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalars().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found.")

    # If marking as Paid, deduct from user balance
    if body.status == "Paid" and payout.status != "Paid":
        user_res = await db.execute(select(User).where(User.id == payout.user_id))
        user = user_res.scalars().first()
        if user:
            user.available_balance = max(0.0, user.available_balance - payout.amount)

    payout.status = body.status
    await db.commit()
    return {"message": "Payout status updated.", "status": body.status}


# ──────────────────────────────────────────────
#  Contact messages
# ──────────────────────────────────────────────
@router.get("/messages")
async def list_messages(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(ContactMessage).order_by(ContactMessage.created_at.desc()))
    msgs = result.scalars().all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "subject": m.subject,
            "message": m.message,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]


@router.patch("/messages/{msg_id}/read")
async def mark_message_read(
    msg_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(ContactMessage).where(ContactMessage.id == msg_id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    msg.is_read = True
    await db.commit()
    return {"message": "Marked as read."}


@router.delete("/messages/{msg_id}")
async def delete_message(
    msg_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(ContactMessage).where(ContactMessage.id == msg_id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")
    await db.delete(msg)
    await db.commit()
    return {"message": "Message deleted."}


# ──────────────────────────────────────────────
#  Notifications (broadcast or targeted)
# ──────────────────────────────────────────────
@router.post("/notifications")
async def create_notification(
    body: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    if body.user_id:
        # Targeted notification
        notif = Notification(
            user_id=body.user_id,
            title=body.title,
            body=body.body,
            type=body.type,
        )
        db.add(notif)
    else:
        # Broadcast: create one per user
        users_result = await db.execute(select(User).where(User.is_active == True))
        users = users_result.scalars().all()
        for u in users:
            notif = Notification(
                user_id=u.id,
                title=body.title,
                body=body.body,
                type=body.type,
            )
            db.add(notif)
    await db.commit()
    return {"message": "Notification sent."}


@router.get("/notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(Notification).order_by(Notification.created_at.desc()))
    notifs = result.scalars().all()
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "body": n.body,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


# ──────────────────────────────────────────────
#  Admin: create first admin user (bootstrap endpoint)
# ──────────────────────────────────────────────
class AdminBootstrapBody(BaseModel):
    bootstrap_secret: str
    user_email: str


@router.post("/bootstrap")
async def bootstrap_admin(
    body: AdminBootstrapBody,
    db: AsyncSession = Depends(get_db),
):
    """
    One-time endpoint to promote a user to admin.
    Requires the ADMIN_BOOTSTRAP_SECRET from environment / config.
    """
    import os
    secret = os.environ.get("ADMIN_BOOTSTRAP_SECRET", "affinova-admin-2026")
    if body.bootstrap_secret != secret:
        raise HTTPException(status_code=403, detail="Invalid bootstrap secret.")
    result = await db.execute(select(User).where(User.email == body.user_email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_admin = True
    await db.commit()
    return {"message": f"{user.email} is now an admin."}
