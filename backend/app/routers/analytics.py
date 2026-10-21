from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models import User, SmartLink, ClickEvent
from app.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Query aggregated stats for this user's links
    result = await db.execute(
        select(
            func.coalesce(func.sum(SmartLink.clicks), 0),
            func.coalesce(func.sum(SmartLink.orders), 0),
            func.coalesce(func.sum(SmartLink.earnings), 0.0)
        ).filter(SmartLink.user_id == current_user.id)
    )
    total_clicks, total_orders, link_earnings = result.first()

    gross_earnings = max(float(current_user.gross_earnings), float(link_earnings))
    available_balance = float(current_user.available_balance)

    return {
        "total_clicks": int(total_clicks),
        "total_orders": int(total_orders),
        "gross_earnings": round(gross_earnings, 2),
        "available_balance": round(available_balance, 2)
    }

@router.get("/detailed")
async def get_detailed_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch user's links
    links_res = await db.execute(
        select(SmartLink).filter(SmartLink.user_id == current_user.id)
    )
    links = links_res.scalars().all()
    link_ids = [l.id for l in links]

    total_clicks = sum(l.clicks for l in links)
    total_orders = sum(l.orders for l in links)
    gross_earnings = max(float(current_user.gross_earnings), sum(float(l.earnings) for l in links))
    available_balance = float(current_user.available_balance)

    conversion_rate = round((total_orders / total_clicks * 100), 2) if total_clicks > 0 else None
    avg_order_value = round((gross_earnings / total_orders), 2) if total_orders > 0 else None

    # 2. Fetch actual click events for this user's links
    events = []
    if link_ids:
        events_res = await db.execute(
            select(ClickEvent).filter(ClickEvent.link_id.in_(link_ids)).order_by(ClickEvent.created_at.desc())
        )
        events = events_res.scalars().all()

    # 3. Calculate 7-day velocity from real events
    now = datetime.utcnow()
    day_labels = []
    day_clicks = []
    for i in range(6, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        label = target_date.strftime("%a")
        day_labels.append(label)
        count = sum(1 for e in events if e.created_at and e.created_at.date() == target_date)
        day_clicks.append(count)

    # 4. Calculate top traffic channels from real user_agent data or links
    traffic_channels = []
    if events:
        mobile_count = sum(1 for e in events if e.user_agent and any(m in e.user_agent.lower() for m in ['mobile', 'android', 'iphone']))
        desktop_count = len(events) - mobile_count
        if mobile_count > 0:
            traffic_channels.append({
                "name": "Mobile Devices (India)",
                "share": f"{round(mobile_count / len(events) * 100)}%",
                "clicks": f"{mobile_count:,}",
                "color": "#2ee6a6"
            })
        if desktop_count > 0:
            traffic_channels.append({
                "name": "Desktop & Web",
                "share": f"{round(desktop_count / len(events) * 100)}%",
                "clicks": f"{desktop_count:,}",
                "color": "#7c8cff"
            })
    elif links:
        # Show top links if events not yet logged individually
        for l in sorted(links, key=lambda x: x.clicks, reverse=True)[:4]:
            if l.clicks > 0:
                traffic_channels.append({
                    "name": l.title[:24],
                    "share": f"{round(l.clicks / max(total_clicks, 1) * 100)}%",
                    "clicks": f"{l.clicks:,}",
                    "color": "#2ee6a6"
                })

    top_source = traffic_channels[0]["name"] if traffic_channels else None

    has_data = total_clicks > 0 or total_orders > 0 or len(events) > 0

    return {
        "has_data": has_data,
        "total_clicks": total_clicks,
        "total_orders": total_orders,
        "gross_earnings": round(gross_earnings, 2),
        "available_balance": round(available_balance, 2),
        "conversion_rate": conversion_rate,
        "avg_order_value": avg_order_value,
        "top_source": top_source,
        "chart_days": day_labels,
        "chart_clicks": day_clicks,
        "traffic_channels": traffic_channels,
        "active_links_count": len(links)
    }
