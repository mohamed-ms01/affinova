import io
import base64
import uuid
from datetime import datetime
from typing import Dict, Any, List
import qrcode
from app.config import settings

POPULAR_BANKS: List[Dict[str, str]] = [
    {"code": "SBI", "name": "State Bank of India", "logo": "🏦"},
    {"code": "HDFC", "name": "HDFC Bank", "logo": "🏢"},
    {"code": "ICICI", "name": "ICICI Bank", "logo": "🏛️"},
    {"code": "AXIS", "name": "Axis Bank", "logo": "🏦"},
    {"code": "KOTAK", "name": "Kotak Mahindra Bank", "logo": "🏢"},
    {"code": "PNB", "name": "Punjab National Bank", "logo": "🏛️"},
    {"code": "BOB", "name": "Bank of Baroda", "logo": "🏦"},
    {"code": "CANARA", "name": "Canara Bank", "logo": "🏛️"},
]

def generate_order_id() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"AFF-PAY-{timestamp}-{unique_suffix}"

def generate_upi_qr_code(amount: float, order_id: str, plan_name: str) -> Dict[str, str]:
    """
    Generates dynamic UPI URI and returns Base64 PNG QR code
    which can be scanned via PhonePe, GPay, Paytm, BHIM, Cred, etc.
    """
    payee_vpa = settings.UPI_ID or "affinova@upi"
    payee_name = settings.UPI_PAYEE_NAME or "Affinova Network"
    formatted_amount = f"{amount:.2f}"
    transaction_note = f"Affinova {plan_name.title()} Plan"

    # UPI 2.0 Standard Deep Link Format
    upi_uri = (
        f"upi://pay?"
        f"pa={payee_vpa}&"
        f"pn={payee_name.replace(' ', '+')}&"
        f"am={formatted_amount}&"
        f"cu=INR&"
        f"tn={transaction_note.replace(' ', '+')}&"
        f"tr={order_id}"
    )

    # Generate QR Code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(upi_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0e131a", back_color="#ffffff")
    
    # Convert image to Base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    base64_qr = "data:image/png;base64," + base64.b64encode(img_bytes).decode("utf-8")

    return {
        "upi_uri": upi_uri,
        "qr_code_base64": base64_qr,
        "payee_vpa": payee_vpa,
        "payee_name": payee_name,
        "amount": amount,
        "order_id": order_id
    }
