import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegister,
    UserVerifyEmail,
    UserLogin,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest
)
from app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.email_service import (
    send_otp_email,
    send_welcome_email,
    send_password_reset_email
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing = await db.execute(select(User).filter(User.email == user_in.email.lower()))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Generate 6-digit verification OTP
    code = f"{random.randint(100000, 999999)}"
    expires = datetime.utcnow() + timedelta(minutes=15)

    new_user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password),
        is_verified=False,
        verification_code=code,
        verification_code_expires=expires,
        plan="starter",
        available_balance=0.0,
        gross_earnings=0.0
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Send real OTP email
    email_sent = send_otp_email(new_user.email, new_user.full_name, code)

    return {
        "message": "Account created successfully. Verification code dispatched.",
        "email": new_user.email,
        "otp_hint": code if not email_sent else None,
        "email_delivered": email_sent
    }


@router.post("/resend-code")
async def resend_code(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == data.email.lower()))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    code = f"{random.randint(100000, 999999)}"
    user.verification_code = code
    user.verification_code_expires = datetime.utcnow() + timedelta(minutes=15)
    await db.commit()

    # Send new OTP
    email_sent = send_otp_email(user.email, user.full_name, code)
    return {
        "message": "New 6-digit verification code dispatched.",
        "otp_hint": code if not email_sent else None,
        "email_delivered": email_sent
    }


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(data: UserVerifyEmail, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == data.email.lower()))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="This account is already verified.")

    if user.verification_code != data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check your email.")

    if user.verification_code_expires and datetime.utcnow() > user.verification_code_expires:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    await db.commit()
    await db.refresh(user)

    # Send welcome email
    send_welcome_email(user.email, user.full_name)

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == credentials.email.lower()))
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the OTP code."
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == req.email.lower()))
    user = result.scalars().first()

    if user:
        # Generate reset OTP and save to DB
        reset_code = f"{random.randint(100000, 999999)}"
        user.verification_code = reset_code
        user.verification_code_expires = datetime.utcnow() + timedelta(minutes=15)
        await db.commit()

        # Send password reset email
        send_password_reset_email(user.email, user.full_name, reset_code)

    # Always return same message (security — don't reveal if email exists)
    return {"message": "If this email is registered, a password reset code has been sent to your inbox."}


@router.post("/reset-password")
async def reset_password(data: UserVerifyEmail, db: AsyncSession = Depends(get_db)):
    """Step 1 of reset: verify OTP. Returns a reset_token for step 2."""
    result = await db.execute(select(User).filter(User.email == data.email.lower()))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if user.verification_code != data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if user.verification_code_expires and datetime.utcnow() > user.verification_code_expires:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Clear code — grant short-lived token to set new password
    user.verification_code = None
    user.verification_code_expires = None
    await db.commit()

    token = create_access_token({"sub": user.id, "email": user.email})
    return {"reset_token": token, "message": "OTP verified. Use this token to set a new password."}


@router.post("/set-new-password")
async def set_new_password(
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Step 2 of reset: set the new password using the reset_token."""
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    current_user.hashed_password = get_password_hash(new_password)
    await db.commit()
    return {"message": "Password updated successfully. You can now log in with your new password."}
