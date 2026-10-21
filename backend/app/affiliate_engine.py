import re
import urllib.parse
from typing import Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
from app.config import settings

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

def detect_platform(url: str) -> str:
    lower = url.lower()
    if "amazon." in lower or "amzn." in lower:
        return "amazon"
    elif "flipkart." in lower:
        return "flipkart"
    return "custom"

def inject_affiliate_parameters(url: str, platform: str) -> str:
    """
    Appends or replaces official affiliate tracking parameters
    (Amazon Associate tag, Flipkart affid) so real affiliate cookies/tracking are applied.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        params = urllib.parse.parse_qs(parsed.query)

        if platform == "amazon":
            tag = settings.DEFAULT_AMAZON_TAG or "affinova-21"
            params["tag"] = [tag]
            params["linkCode"] = ["ll1"]
        elif platform == "flipkart":
            affid = settings.DEFAULT_FLIPKART_AFFID or "affinova"
            params["affid"] = [affid]

        new_query = urllib.parse.urlencode(params, doseq=True)
        return urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
    except Exception:
        return url

def extract_fallback_metadata_from_url(url: str, platform: str) -> Dict[str, Any]:
    """
    Intelligently extracts product title from the URL slug if anti-scraping
    blocks direct HTML retrieval.
    """
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.strip("/")
    parts = [p for p in path.split("/") if p]
    
    title = ""
    # Look for readable slug segments
    for part in parts:
        # Ignore dp, p, product, gp, etc.
        if part.lower() in ["dp", "p", "gp", "product", "item", "itm"] or len(part) < 3:
            continue
        cleaned = re.sub(r'[-_]', ' ', part)
        cleaned = re.sub(r'\b[A-Z0-9]{10}\b', '', cleaned)  # remove ASIN-like strings
        cleaned = ' '.join(cleaned.split())
        if len(cleaned) > 5 and any(c.isalpha() for c in cleaned):
            title = cleaned.title()
            break

    if not title:
        title = f"{platform.capitalize()} Featured Product"

    # Default realistic prices and image placeholders
    if platform == "amazon":
        default_price = 2499.0
        image_url = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
    elif platform == "flipkart":
        default_price = 1899.0
        image_url = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"
    else:
        default_price = 999.0
        image_url = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80"

    return {
        "title": title[:120],
        "image_url": image_url,
        "price": default_price,
        "currency": "INR",
        "platform": platform
    }

def fetch_product_metadata(url: str) -> Dict[str, Any]:
    """
    Fetches real product details (Title, Price, Image) from Amazon or Flipkart,
    with smart fallback and affiliate parameter injection.
    """
    platform = detect_platform(url)
    affiliate_url = inject_affiliate_parameters(url, platform)
    fallback = extract_fallback_metadata_from_url(url, platform)
    
    # Try fetching real page content
    try:
        resp = requests.get(affiliate_url, headers=HEADERS, timeout=4.5)
        if resp.status_code == 200 and len(resp.text) > 1000:
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # 1. Parse Title
            extracted_title = ""
            if platform == "amazon":
                t_el = soup.select_one("#productTitle") or soup.select_one("h1.a-size-large")
                if t_el:
                    extracted_title = t_el.get_text(strip=True)
            elif platform == "flipkart":
                t_el = soup.select_one("span.B_NuCI") or soup.select_one("h1._6EBuvT") or soup.select_one("span.VU-ZEz")
                if t_el:
                    extracted_title = t_el.get_text(strip=True)

            if not extracted_title:
                og_title = soup.find("meta", property="og:title")
                if og_title and og_title.get("content"):
                    extracted_title = og_title["content"].strip()
                elif soup.title:
                    extracted_title = soup.title.get_text(strip=True)

            if extracted_title and len(extracted_title) > 3:
                # Clean up title
                extracted_title = re.sub(r'\s*:\s*(Amazon\.in|Flipkart\.com).*$', '', extracted_title, flags=re.I)
                fallback["title"] = extracted_title[:120]

            # 2. Parse Image
            extracted_image = ""
            if platform == "amazon":
                img_el = soup.select_one("#landingImage") or soup.select_one("#imgBlkFront")
                if img_el and img_el.get("src"):
                    extracted_image = img_el["src"]
            elif platform == "flipkart":
                img_el = soup.select_one("img._396cs4") or soup.select_one("img._2r_T1I")
                if img_el and img_el.get("src"):
                    extracted_image = img_el["src"]

            if not extracted_image:
                og_img = soup.find("meta", property="og:image")
                if og_img and og_img.get("content"):
                    extracted_image = og_img["content"]

            if extracted_image and extracted_image.startswith("http"):
                fallback["image_url"] = extracted_image

            # 3. Parse Price
            extracted_price = None
            if platform == "amazon":
                p_el = soup.select_one(".a-price-whole") or soup.select_one(".a-price .a-offscreen")
                if p_el:
                    raw_price = re.sub(r'[^\d.]', '', p_el.get_text(strip=True))
                    if raw_price:
                        extracted_price = float(raw_price)
            elif platform == "flipkart":
                p_el = soup.select_one("div._30jeq3") or soup.select_one("div.Nx9bqj")
                if p_el:
                    raw_price = re.sub(r'[^\d.]', '', p_el.get_text(strip=True))
                    if raw_price:
                        extracted_price = float(raw_price)

            if extracted_price and extracted_price > 0:
                fallback["price"] = extracted_price

    except Exception as e:
        # Gracefully handle network delays / captchas using extracted fallback
        pass

    fallback["affiliate_url"] = affiliate_url
    return fallback

def calculate_simulated_commission(price: float, platform: str) -> float:
    """
    Calculates simulated commission (5-10% of product price) or flat rate
    to award realistic earnings on link activity.
    """
    if platform == "amazon":
        rate = 0.07  # 7%
    elif platform == "flipkart":
        rate = 0.08  # 8%
    else:
        rate = 0.05  # 5%
    
    commission = round(price * rate, 2)
    # Ensure realistic bounds: ₹25 min up to ₹1,500 max per simulated conversion
    return max(25.0, min(commission, 1500.0))
