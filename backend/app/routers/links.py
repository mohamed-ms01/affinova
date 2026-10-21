import random
import string
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User, SmartLink
from app.schemas import SmartLinkCreate, SmartLinkResponse
from app.security import get_current_user
from app.affiliate_engine import fetch_product_metadata
from app.mongodb import links_col

router = APIRouter(prefix="/api/links", tags=["Smart Links"])

def generate_random_slug(length: int = 7) -> str:
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choices(chars, k=length))

@router.get("", response_model=dict)
async def get_user_links(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SmartLink).filter(SmartLink.user_id == current_user.id).order_by(SmartLink.created_at.desc())
    )
    links = result.scalars().all()
    return {"links": [SmartLinkResponse.model_validate(l) for l in links]}

@router.post("", response_model=SmartLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_smart_link(
    link_in: SmartLinkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch real product metadata from Amazon/Flipkart or fallback
    product_meta = fetch_product_metadata(link_in.destination_url.strip())
    
    # Title resolution: use user title if provided, otherwise auto-scraped title
    final_title = link_in.title.strip() if link_in.title and link_in.title.strip() else product_meta["title"]
    # Final destination URL with real affiliate tag injected
    final_destination_url = product_meta.get("affiliate_url", link_in.destination_url.strip())
    platform = product_meta.get("platform", "custom")
    product_image = product_meta.get("image_url")
    product_price = float(product_meta.get("price", 0.0))

    # Determine unique slug
    if link_in.custom_slug:
        slug = link_in.custom_slug.strip().lower()
        existing = await db.execute(select(SmartLink).filter(SmartLink.slug == slug))
        if existing.scalars().first():
            raise HTTPException(
                status_code=400,
                detail=f"The custom slug '{slug}' is already taken. Please choose another."
            )
    else:
        # Prefix with platform for brand authority (e.g. amz-xxxx, fk-xxxx)
        prefix = "amz" if platform == "amazon" else "fk" if platform == "flipkart" else "link"
        for _ in range(5):
            slug = f"{prefix}-{generate_random_slug(5)}"
            existing = await db.execute(select(SmartLink).filter(SmartLink.slug == slug))
            if not existing.scalars().first():
                break

    new_link = SmartLink(
        user_id=current_user.id,
        title=final_title,
        destination_url=final_destination_url,
        slug=slug,
        clicks=0,
        orders=0,
        earnings=0.0,
        bot_filtering=link_in.bot_filtering if link_in.bot_filtering is not None else True,
        is_active=True,
        platform=platform,
        product_image=product_image,
        product_price=product_price
    )

    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)

    # Sync to MongoDB collection
    m_links = links_col()
    if m_links is not None:
        try:
            await m_links.insert_one({
                "id": new_link.id,
                "user_id": current_user.id,
                "title": final_title,
                "destination_url": final_destination_url,
                "slug": slug,
                "clicks": 0,
                "orders": 0,
                "earnings": 0.0,
                "bot_filtering": new_link.bot_filtering,
                "is_active": True,
                "platform": platform,
                "product_image": product_image,
                "product_price": product_price,
                "created_at": datetime.utcnow()
            })
        except Exception as e:
            print(f"[MONGODB SYNC ERROR] {e}")

    print(f"\n[AFFINOVA AFFILIATE LINK GENERATED] Platform: {platform.upper()} | Title: {final_title} | Slug: /r/{slug}\n")
    return SmartLinkResponse.model_validate(new_link)

@router.delete("/{link_id}", status_code=status.HTTP_200_OK)
async def delete_smart_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SmartLink).filter(SmartLink.id == link_id, SmartLink.user_id == current_user.id)
    )
    link = result.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Smart link not found.")

    await db.delete(link)
    await db.commit()

    # Sync delete to MongoDB
    m_links = links_col()
    if m_links is not None:
        try:
            await m_links.delete_one({"id": link_id, "user_id": current_user.id})
        except Exception as e:
            print(f"[MONGODB SYNC ERROR] {e}")

    return {"message": "Smart link deleted successfully."}
