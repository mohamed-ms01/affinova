import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=False)  # Mandatory requirement
    hashed_password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    verification_code = Column(String(6), nullable=True)
    verification_code_expires = Column(DateTime, nullable=True)
    plan = Column(String(50), default="starter")  # starter, pro, elite
    available_balance = Column(Float, default=0.0)
    gross_earnings = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    links = relationship("SmartLink", back_populates="owner", cascade="all, delete-orphan")
    payouts = relationship("Payout", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class SmartLink(Base):
    __tablename__ = "smart_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    destination_url = Column(Text, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    clicks = Column(Integer, default=0)
    orders = Column(Integer, default=0)
    earnings = Column(Float, default=0.0)
    bot_filtering = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    platform = Column(String(50), default="custom")
    product_image = Column(Text, nullable=True)
    product_price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="links")
    click_events = relationship("ClickEvent", back_populates="link", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    order_id = Column(String(100), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    plan = Column(String(50), nullable=False)
    method = Column(String(50), nullable=False)  # upi, netbanking
    bank_name = Column(String(100), nullable=True)
    utr_ref = Column(String(100), nullable=True)
    status = Column(String(50), default="success")  # success, pending, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payments")

class ClickEvent(Base):
    __tablename__ = "click_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    link_id = Column(String(36), ForeignKey("smart_links.id"), nullable=False)
    ip_hash = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    country = Column(String(50), default="India")
    is_bot = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    link = relationship("SmartLink", back_populates="click_events")

class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String(50), nullable=False)  # upi, bank, paypal
    details = Column(String(255), nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Processing, Paid
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payouts")

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # None = broadcast
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, payment
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
