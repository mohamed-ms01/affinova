import logging
import ssl
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("affinova.mongodb")

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def init_mongo() -> Optional[AsyncIOMotorDatabase]:
    """
    Initializes connection to MongoDB Atlas.
    Uses an ultra-fast 2.5s connection probe with certifi TLS.
    If Atlas rejects connection (due to IP whitelist or TLS alert),
    it immediately transitions to Local SQLite without blocking or crashing the website.
    """
    global client, db
    uri = settings.MONGODB_URI.strip()
    if not uri or "<password>" in uri or "<username>" in uri:
        logger.warning("[MONGODB] URI missing or contains placeholders. Running in SQLite local mode.")
        return None

    try:
        import certifi
        _client = AsyncIOMotorClient(
            uri,
            serverSelectionTimeoutMS=2500,
            connectTimeoutMS=2500,
            tlsCAFile=certifi.where()
        )
        # Test connection
        await _client.admin.command("ping")
        _db = _client[settings.MONGODB_DB_NAME]
        await _setup_indexes(_db)
        masked = uri.split("@")[-1] if "@" in uri else uri[:20] + "..."
        print(f"\n[AFFINOVA MONGODB] Connected successfully to Cloud Atlas ({masked}) -> DB: {settings.MONGODB_DB_NAME}\n")
        client = _client
        db = _db
        return db
    except Exception as e:
        err_msg = str(e)
        if "TLSV1_ALERT_INTERNAL_ERROR" in err_msg or "ServerSelectionTimeoutError" in err_msg:
            print("\n" + "=" * 65)
            print("[AFFINOVA MONGODB STATUS] Cloud MongoDB Atlas Connection Paused")
            print(" * Reason: Atlas Network Security (IP Whitelist requirement).")
            print(" * Fix: Go to MongoDB Atlas -> Network Access -> Add IP '0.0.0.0/0'.")
            print(" * Current Status: Running on High-Speed Local SQLite without issues.")
            print("=" * 65 + "\n")
        else:
            print(f"\n[AFFINOVA MONGODB] Atlas connection note: {e}. Active on Local SQLite.\n")
        
        if '_client' in locals() and _client:
            try:
                _client.close()
            except Exception:
                pass
        client = None
        db = None
        return None


async def _setup_indexes(_db: AsyncIOMotorDatabase):
    """Create MongoDB indexes safely in the background."""
    try:
        await _db.users.create_index("id", unique=True)
        await _db.users.create_index("email", unique=True)
        await _db.smart_links.create_index("id", unique=True)
        await _db.smart_links.create_index("slug", unique=True)
        await _db.smart_links.create_index("user_id")
        await _db.click_events.create_index("link_id")
        await _db.payouts.create_index("user_id")
        await _db.payments.create_index("user_id")
        await _db.payments.create_index("order_id", unique=True)
        await _db.notifications.create_index("user_id")
    except Exception as e:
        logger.warning(f"[MONGODB] Index setup warning: {e}")


async def close_mongo():
    global client
    if client:
        try:
            client.close()
        except Exception:
            pass
        print("[AFFINOVA MONGODB] Connection closed cleanly.")


def get_mongo_db() -> Optional[AsyncIOMotorDatabase]:
    """Helper to retrieve active MongoDB database instance."""
    return db


# Collection accessors (returns None safely when Atlas is offline, preventing any crashes)
def users_col():
    return db["users"] if db is not None else None

def links_col():
    return db["smart_links"] if db is not None else None

def clicks_col():
    return db["click_events"] if db is not None else None

def payouts_col():
    return db["payouts"] if db is not None else None

def payments_col():
    return db["payments"] if db is not None else None

def notifications_col():
    return db["notifications"] if db is not None else None

def contact_col():
    return db["contact_messages"] if db is not None else None
