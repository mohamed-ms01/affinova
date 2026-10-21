import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load .env from backend folder and project root
_app_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_app_dir)
_root_dir = os.path.dirname(_backend_dir)

# Load both possible locations — override=True ensures values are always applied
load_dotenv(os.path.join(_root_dir, ".env"), override=True)
load_dotenv(os.path.join(_backend_dir, ".env"), override=True)

_db_path = os.path.abspath(os.path.join(_root_dir, "affinova.db")).replace("\\", "/")
# On Linux, absolute path starts with '/', so sqlite+aiosqlite:////path
if not _db_path.startswith("/"):
    _db_url = f"sqlite+aiosqlite:///{_db_path}"
else:
    _db_url = f"sqlite+aiosqlite://{_db_path}"

class Settings(BaseSettings):
    APP_NAME: str = "Affinova"
    SECRET_KEY: str = os.getenv("AFFINOVA_SECRET_KEY", "affinova-super-secure-production-key-2026-xyz789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = _db_url
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "affinova")

    # Payment Settings (UPI & Razorpay)
    UPI_ID: str = os.getenv("UPI_ID", "affinova@upi")
    UPI_PAYEE_NAME: str = os.getenv("UPI_PAYEE_NAME", "Affinova Network")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")

    # Affiliate Defaults
    DEFAULT_AMAZON_TAG: str = os.getenv("DEFAULT_AMAZON_TAG", "affinova-21")
    DEFAULT_FLIPKART_AFFID: str = os.getenv("DEFAULT_FLIPKART_AFFID", "affinova")

    # Gmail SMTP — hardcoded as reliable defaults in case .env fails to load
    GMAIL_USER: str = os.getenv("GMAIL_USER", "mohamednajmudeen25@gmail.com")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "ynpwjjqqlujcvfzc")

    class Config:
        env_file = [
            os.path.join(_backend_dir, ".env"),
            os.path.join(_root_dir, ".env")
        ]
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()
