import os
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.database import engine, Base, get_db
from app.models import SmartLink, ClickEvent, User, Notification
from app.routers import auth, links, analytics, payouts, plans, user, admin, payments
from app.mongodb import (
    init_mongo,
    close_mongo,
    links_col,
    clicks_col,
    users_col,
    notifications_col
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite tables asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("\n[AFFINOVA BACKEND] SQLite database initialized. Tables ready.")

    # 2. Initialize online/cloud MongoDB connection
    try:
        await init_mongo()
    except Exception as e:
        print(f"[AFFINOVA WARNING] MongoDB init warning: {e}")

    yield

    # Cleanup connections
    await close_mongo()

app = FastAPI(
    title=settings.APP_NAME,
    description="Next-Generation Affiliate Infrastructure Backend & API",
    version="2.7.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(links.router)
app.include_router(analytics.router)
app.include_router(payouts.router)
app.include_router(plans.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(payments.router)

# Live Smart Link Redirection & Telemetry Tracker
@app.get("/r/{slug}")
async def redirect_smart_link(slug: str, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SmartLink).filter(SmartLink.slug == slug.lower()))
    link = result.scalars().first()

    if not link:
        # Fallback to homepage
        return RedirectResponse(url="/?ref=invalid_slug")

    if not link.is_active:
        return RedirectResponse(url="/?ref=inactive_link")

    # Record click telemetry
    user_agent = request.headers.get("user-agent", "Unknown")
    is_bot = "bot" in user_agent.lower() or "crawl" in user_agent.lower()

    # Track click count
    link.clicks += 1

    # SIMULATED EARNINGS / REAL MONEY VALUE FOR PROJECT DEMO:
    # Every click adds a realistic simulated affiliate reward:
    # 1. Baseline CPC (Cost Per Click): ₹3.50 - ₹8.00
    # 2. Every 2nd or 3rd click simulates a product order conversion with 5-8% commission!
    base_click_reward = 5.0
    order_commission = 0.0
    new_order = False

    if link.clicks % 2 == 0:
        new_order = True
        link.orders += 1
        product_price = float(getattr(link, "product_price", 0.0) or 1500.0)
        # 6% commission
        order_commission = round(product_price * 0.06, 2)
        order_commission = max(35.0, min(order_commission, 850.0))

    total_added_earning = round(base_click_reward + order_commission, 2)
    link.earnings = round(link.earnings + total_added_earning, 2)

    # Credit to owner's account balance and gross earnings
    user_res = await db.execute(select(User).filter(User.id == link.user_id))
    owner = user_res.scalars().first()
    if owner:
        owner.available_balance = round(owner.available_balance + total_added_earning, 2)
        owner.gross_earnings = round(owner.gross_earnings + total_added_earning, 2)

        # Create user notification if order simulated
        if new_order:
            notif = Notification(
                user_id=owner.id,
                title="Affiliate Conversion Earned!",
                body=f"You earned ₹{total_added_earning:.2f} commission from '{link.title[:30]}' ({link.platform.upper()}).",
                type="success"
            )
            db.add(notif)

    click_event = ClickEvent(
        link_id=link.id,
        user_agent=user_agent[:250],
        is_bot=is_bot,
        country="India"
    )
    db.add(click_event)
    await db.commit()

    # Sync click telemetry and earnings to MongoDB
    m_clicks = clicks_col()
    if m_clicks is not None:
        try:
            await m_clicks.insert_one({
                "link_id": link.id,
                "user_agent": user_agent[:250],
                "is_bot": is_bot,
                "country": "India",
                "created_at": datetime.utcnow()
            })
            m_links = links_col()
            if m_links is not None:
                await m_links.update_one(
                    {"slug": slug.lower()},
                    {"$set": {
                        "clicks": link.clicks,
                        "orders": link.orders,
                        "earnings": link.earnings
                    }}
                )
            if owner:
                m_users = users_col()
                if m_users is not None:
                    await m_users.update_one(
                        {"id": owner.id},
                        {"$set": {
                            "available_balance": owner.available_balance,
                            "gross_earnings": owner.gross_earnings
                        }}
                    )
        except Exception as e:
            print(f"[MONGODB SYNC ERROR] {e}")

    print(f"\n[AFFINOVA REDIRECT] Slug: {slug} -> {link.destination_url} | Clicks: {link.clicks} | +₹{total_added_earning} earned\n")
    return RedirectResponse(url=link.destination_url, status_code=302)

# Path definitions
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DASHBOARD_DIST_DIR = os.path.join(BASE_DIR, "dashboard", "dist")
ADMIN_DIR = os.path.join(BASE_DIR, "admin")

# Mount React User Dashboard at /dashboard
if os.path.exists(DASHBOARD_DIST_DIR):
    app.mount("/dashboard", StaticFiles(directory=DASHBOARD_DIST_DIR, html=True), name="dashboard")

# Mount Admin Panel at /admin-panel
if os.path.exists(ADMIN_DIR):
    app.mount("/admin-panel", StaticFiles(directory=ADMIN_DIR, html=True), name="admin_panel")

# Mount Public Website (HTML, CSS, JS, Login, Register) at root /
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
