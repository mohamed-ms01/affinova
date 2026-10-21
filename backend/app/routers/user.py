from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, ContactMessage, Notification
from app.schemas import UserUpdate, UserResponse, ContactCreate
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["User & Contact"])

@router.put("/user/profile", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip()
    if data.phone_number is not None:
        current_user.phone_number = data.phone_number.strip()

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/contact")
async def submit_contact_form(
    data: ContactCreate,
    db: AsyncSession = Depends(get_db)
):
    new_message = ContactMessage(
        name=data.name,
        email=data.email,
        subject=data.subject,
        message=data.message
    )
    db.add(new_message)
    await db.commit()

    print(f"\n[AFFINOVA CONTACT INQUIRY] From: {data.name} ({data.email}) | Subject: {data.subject}\n")
    return {"message": "Inquiry recorded successfully. We will follow up promptly."}


# ── User Notifications ──────────────────────────────────────────────
@router.get("/notifications")
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where((Notification.user_id == current_user.id) | (Notification.user_id == None))
        .order_by(Notification.created_at.desc())
        .limit(10)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notif_id, Notification.user_id == current_user.id)
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read."}
