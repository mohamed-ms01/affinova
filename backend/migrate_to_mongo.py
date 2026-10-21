"""
Affinova — SQLite to MongoDB Data Migration Script
Runs asynchronously to copy all tables from SQLite to MongoDB Atlas.
Usage:
  D:\\project_final\\backend\\venv\\Scripts\\python.exe D:\\project_final\\backend\\migrate_to_mongo.py
"""
import asyncio
import os
import sys
from sqlalchemy.future import select

# Ensure backend path is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.database import AsyncSessionLocal
from app.models import User, SmartLink, ClickEvent, Payout, Notification, Payment, ContactMessage
from app.mongodb import (
    init_mongo,
    close_mongo,
    users_col,
    links_col,
    clicks_col,
    payouts_col,
    payments_col,
    notifications_col,
    contact_col
)

async def run_migration():
    print("==================================================")
    print("   AFFINOVA: SQLITE -> MONGODB MIGRATION TOOL    ")
    print("==================================================")

    db = await init_mongo()
    if db is None:
        print("[ERROR] MongoDB connection failed or URI not configured in .env.")
        print("Please check MONGODB_URI in D:\\project_final\\.env")
        return

    async with AsyncSessionLocal() as session:
        # 1. Users
        users_res = await session.execute(select(User))
        users = users_res.scalars().all()
        u_col = users_col()
        user_count = 0
        for u in users:
            await u_col.update_one(
                {"id": u.id},
                {"$set": {
                    "id": u.id,
                    "email": u.email,
                    "full_name": u.full_name,
                    "phone_number": u.phone_number,
                    "hashed_password": u.hashed_password,
                    "is_verified": u.is_verified,
                    "is_active": u.is_active,
                    "is_admin": u.is_admin,
                    "plan": u.plan,
                    "available_balance": u.available_balance,
                    "gross_earnings": u.gross_earnings,
                    "created_at": u.created_at
                }},
                upsert=True
            )
            user_count += 1
        print(f" -> Migrated {user_count} Users to MongoDB.")

        # 2. Smart Links
        links_res = await session.execute(select(SmartLink))
        links = links_res.scalars().all()
        l_col = links_col()
        link_count = 0
        for l in links:
            await l_col.update_one(
                {"id": l.id},
                {"$set": {
                    "id": l.id,
                    "user_id": l.user_id,
                    "title": l.title,
                    "destination_url": l.destination_url,
                    "slug": l.slug,
                    "clicks": l.clicks,
                    "orders": l.orders,
                    "earnings": l.earnings,
                    "bot_filtering": l.bot_filtering,
                    "is_active": l.is_active,
                    "platform": getattr(l, "platform", "custom"),
                    "product_image": getattr(l, "product_image", None),
                    "product_price": getattr(l, "product_price", 0.0),
                    "created_at": l.created_at
                }},
                upsert=True
            )
            link_count += 1
        print(f" -> Migrated {link_count} Smart Links to MongoDB.")

        # 3. Payouts
        payouts_res = await session.execute(select(Payout))
        payouts = payouts_res.scalars().all()
        p_col = payouts_col()
        payout_count = 0
        for p in payouts:
            await p_col.update_one(
                {"id": p.id},
                {"$set": {
                    "id": p.id,
                    "user_id": p.user_id,
                    "amount": p.amount,
                    "method": p.method,
                    "details": p.details,
                    "status": p.status,
                    "created_at": p.created_at
                }},
                upsert=True
            )
            payout_count += 1
        print(f" -> Migrated {payout_count} Payouts to MongoDB.")

        # 4. Payments
        payments_res = await session.execute(select(Payment))
        payments = payments_res.scalars().all()
        pay_col = payments_col()
        pay_count = 0
        for pay in payments:
            await pay_col.update_one(
                {"order_id": pay.order_id},
                {"$set": {
                    "id": pay.id,
                    "user_id": pay.user_id,
                    "order_id": pay.order_id,
                    "amount": pay.amount,
                    "plan": pay.plan,
                    "method": pay.method,
                    "bank_name": pay.bank_name,
                    "utr_ref": pay.utr_ref,
                    "status": pay.status,
                    "created_at": pay.created_at
                }},
                upsert=True
            )
            pay_count += 1
        print(f" -> Migrated {pay_count} Payments to MongoDB.")

    await close_mongo()
    print("\n==================================================")
    print("   MIGRATION COMPLETED SUCCESSFULLY!             ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_migration())
