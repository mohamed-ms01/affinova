from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    password: str

class UserVerifyEmail(BaseModel):
    email: EmailStr
    code: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: str
    plan: str
    available_balance: float
    gross_earnings: float
    is_verified: bool
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class SmartLinkCreate(BaseModel):
    title: Optional[str] = None
    destination_url: str
    custom_slug: Optional[str] = None
    bot_filtering: Optional[bool] = True

class SmartLinkResponse(BaseModel):
    id: str
    title: str
    destination_url: str
    slug: str
    clicks: int
    orders: int
    earnings: float
    bot_filtering: bool
    is_active: bool
    platform: Optional[str] = "custom"
    product_image: Optional[str] = None
    product_price: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentOrderCreate(BaseModel):
    plan: str  # starter, pro, elite
    method: str  # upi, netbanking
    bank_name: Optional[str] = None

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: float
    plan: str
    method: str
    upi_details: Optional[dict] = None
    popular_banks: Optional[List[dict]] = None
    razorpay_order_id: Optional[str] = None
    razorpay_key_id: Optional[str] = None
    currency: Optional[str] = "INR"

class PaymentVerifyRequest(BaseModel):
    order_id: str
    utr_ref: Optional[str] = None
    bank_name: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

class PaymentTransactionResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    plan: str
    method: str
    bank_name: Optional[str] = None
    utr_ref: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PayoutCreate(BaseModel):
    amount: float
    method: str  # upi, bank, paypal
    details: str

class PayoutResponse(BaseModel):
    id: str
    amount: float
    method: str
    details: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PlanSubscribe(BaseModel):
    plan: str

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
