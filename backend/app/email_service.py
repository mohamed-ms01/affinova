"""
Affinova Email Service — Gmail SMTP
Real transactional emails for OTP, password reset, and notifications.
Falls back to console print if SMTP is not configured.
"""
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from typing import Optional

from app.config import settings


def _is_configured() -> bool:
    return bool(settings.GMAIL_USER and settings.GMAIL_APP_PASSWORD
                and settings.GMAIL_APP_PASSWORD != "your_app_password_here")


def _send_smtp(to_email: str, subject: str, html_body: str, plain_body: str = "") -> bool:
    """Core SMTP sender via Gmail SSL (port 465) with STARTTLS (port 587) fallback."""
    password = settings.GMAIL_APP_PASSWORD.replace(" ", "")
    user = settings.GMAIL_USER.strip()

    # Fallback plain text if not provided
    if not plain_body:
        plain_body = "Affinova Verification Code. Please open this email in an HTML-compatible client."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Affinova <{user}>"
    msg["To"] = to_email
    msg["Reply-To"] = user
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")

    # Anti-spam rule: Plain text part MUST come before HTML in multipart/alternative
    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # Attempt 1: SSL on port 465
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx, timeout=8) as server:
            server.login(user, password)
            server.sendmail(user, to_email, msg.as_string())
        return True
    except Exception as e1:
        # Attempt 2: TLS on port 587
        try:
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=8) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(user, to_email, msg.as_string())
            return True
        except Exception as e2:
            print(f"[AFFINOVA EMAIL ERROR] Failed SSL ({e1}) and TLS ({e2}) to {to_email}")
            return False


# ── HTML Templates ─────────────────────────────────────────────────
def _base_template(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  *{{margin:0;padding:0;box-sizing:border-box;}}
  body{{font-family:'Segoe UI',Arial,sans-serif;background:#07090e;color:#e8ecf4;}}
  .wrap{{max-width:560px;margin:40px auto;background:#0e1420;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;}}
  .header{{background:linear-gradient(135deg,#0e1a2b,#162035);padding:32px;text-align:center;border-bottom:1px solid rgba(46,230,166,0.2);}}
  .logo{{font-size:26px;font-weight:700;background:linear-gradient(135deg,#2ee6a6,#7c8cff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}}
  .tagline{{color:#6b7a9a;font-size:13px;margin-top:4px;}}
  .body{{padding:36px 32px;}}
  .greeting{{font-size:20px;font-weight:600;margin-bottom:12px;color:#e8ecf4;}}
  .text{{color:#8899bb;font-size:15px;line-height:1.7;margin-bottom:20px;}}
  .otp-box{{background:linear-gradient(135deg,rgba(46,230,166,0.08),rgba(124,140,255,0.08));border:1px solid rgba(46,230,166,0.3);border-radius:14px;padding:28px;text-align:center;margin:24px 0;}}
  .otp{{font-size:44px;font-weight:700;letter-spacing:12px;color:#2ee6a6;font-family:'Courier New',monospace;}}
  .otp-label{{color:#6b7a9a;font-size:13px;margin-top:8px;}}
  .expiry{{background:rgba(255,176,32,0.08);border:1px solid rgba(255,176,32,0.2);border-radius:10px;padding:12px 18px;color:#ffb020;font-size:13px;margin-bottom:20px;}}
  .btn{{display:inline-block;background:linear-gradient(135deg,#2ee6a6,#20c997);color:#0a1f1a;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;margin:8px 0;}}
  .divider{{border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;}}
  .footer{{background:#070a0f;padding:24px 32px;text-align:center;}}
  .footer-text{{color:#4a5568;font-size:12px;line-height:1.6;}}
  .footer a{{color:#2ee6a6;text-decoration:none;}}
  .warn{{color:#ff4d6d;font-size:13px;margin-top:8px;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">Affinova</div>
    <div class="tagline">Next-Generation Affiliate Platform</div>
  </div>
  <div class="body">
    {content}
  </div>
  <div class="footer">
    <p class="footer-text">
      &copy; 2026 Affinova. All rights reserved.<br/>
      This email was sent to you because an action was taken on your account.<br/>
      If you did not request this, please ignore this email.
    </p>
  </div>
</div>
</body>
</html>"""


# ── Public functions ────────────────────────────────────────────────

def send_otp_email(to_email: str, full_name: str, otp_code: str) -> bool:
    """Send email verification OTP with rich welcome, perks, and earning guide."""
    first_name = full_name.split()[0] if full_name else "Partner"
    content = f"""
    <p class="greeting" style="font-size:22px;color:#ffffff;margin-bottom:8px;">Welcome to Affinova, {first_name}! &#128075;</p>
    <p class="text" style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:20px;">
      You're just one quick verification step away from joining India's highest-converting smart affiliate platform. 
      Use the secure code below to activate your account and start generating high-yield tracked campaigns.
    </p>

    <!-- OTP Code Box -->
    <div class="otp-box" style="background:linear-gradient(135deg,rgba(46,230,166,0.1),rgba(124,140,255,0.1));border:1px solid rgba(46,230,166,0.35);border-radius:16px;padding:24px;text-align:center;margin:22px 0;">
      <div style="font-size:11px;color:#2ee6a6;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">Your One-Time Passcode</div>
      <div class="otp" style="font-size:42px;font-weight:800;letter-spacing:10px;color:#2ee6a6;font-family:'Courier New',Courier,monospace;">{otp_code}</div>
      <div style="font-size:12px;color:#64748b;margin-top:8px;">Valid for 15 minutes &bull; Strictly confidential</div>
    </div>

    <div class="expiry" style="background:rgba(255,176,32,0.08);border:1px solid rgba(255,176,32,0.25);border-radius:10px;padding:10px 14px;color:#ffb020;font-size:12px;margin-bottom:28px;">
      &#9201; <strong>Security Notice:</strong> Never share this code with anyone. Affinova staff will never ask for your verification code.
    </div>

    <!-- Make Your Best Earnings With Us Section -->
    <div style="background:#090d14;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#ffffff;font-size:16px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
        &#128640; Make Your Best Earnings With Affinova
      </h3>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:16px;">
        Designed specifically for content creators, publishers, and media buyers across India:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#cbd5e1;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;width:24px;">&#9989;</td>
          <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#ffffff;">Industry-Leading Commissions:</strong> Earn up to 35% commission on verified purchases from top e-commerce and digital brands.
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;">&#9989;</td>
          <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#ffffff;">Real-Time Edge Analytics:</strong> Zero attribution drift. Monitor incoming clicks, orders, and EPC live as they happen.
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:top;">&#9989;</td>
          <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <strong style="color:#ffffff;">Instant Multi-Rail Payouts:</strong> Withdraw your settled funds directly to your UPI ID or Bank Account (min. threshold &#8377;1,000).
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;vertical-align:top;">&#9989;</td>
          <td style="padding:10px 8px;">
            <strong style="color:#ffffff;">Click Fraud & Bot Shield:</strong> Built-in traffic filters ensure only authentic human engagements are credited.
          </td>
        </tr>
      </table>
    </div>

    <!-- 3 Simple Steps to Start Earning -->
    <div style="background:rgba(46,230,166,0.04);border:1px solid rgba(46,230,166,0.2);border-radius:16px;padding:22px;margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;color:#2ee6a6;margin-bottom:12px;">&#9889; Start Earning in 3 Simple Steps:</div>
      <ol style="margin-left:18px;color:#94a3b8;font-size:13px;line-height:1.7;">
        <li><strong style="color:#ffffff;">Enter OTP</strong> on the registration screen to activate your dashboard.</li>
        <li><strong style="color:#ffffff;">Paste Any Product Link</strong> in the Smart Link Generator to generate your tracked Affinova link.</li>
        <li><strong style="color:#ffffff;">Share on YouTube, Instagram, WhatsApp or Telegram</strong> &amp; earn commissions on every successful sale!</li>
      </ol>
    </div>

    <!-- Active Tier Pricing Summary -->
    <div style="text-align:center;padding:16px;background:#090d14;border:1px solid rgba(255,255,255,0.05);border-radius:12px;margin-bottom:20px;">
      <span style="font-size:12px;color:#64748b;">Flexible Creator Plans:</span>
      <span style="display:inline-block;margin:0 6px;padding:3px 10px;background:rgba(46,230,166,0.1);color:#2ee6a6;font-size:12px;font-weight:700;border-radius:6px;">Starter &#8377;19/mo</span>
      <span style="display:inline-block;margin:0 6px;padding:3px 10px;background:rgba(124,140,255,0.1);color:#7c8cff;font-size:12px;font-weight:700;border-radius:6px;">Pro Growth &#8377;249/mo</span>
      <span style="display:inline-block;margin:0 6px;padding:3px 10px;background:rgba(255,176,32,0.1);color:#ffb020;font-size:12px;font-weight:700;border-radius:6px;">Elite &#8377;499/mo</span>
    </div>

    <p class="text" style="font-size:12px;color:#475569;margin-top:16px;text-align:center;">
      If you did not initiate this request, no action is needed &mdash; your email address remains safe.
    </p>
    """
    subject = f"Your Affinova verification code: {otp_code}"
    plain_body = f"""Welcome to Affinova, {first_name}!

Your one-time verification code is: {otp_code}

This code expires in 15 minutes. Please enter it on the registration screen to activate your account.

Make your best earnings with Affinova:
- Industry-leading commissions up to 35%
- Real-time click tracking
- Instant multi-rail payouts via UPI & Bank

Affinova Team
"""
    if _is_configured():
        success = _send_smtp(to_email, subject, _base_template(content), plain_body)
        if success:
            print(f"[AFFINOVA EMAIL] OTP email sent to {to_email}")
            return True
    # Fallback: console
    print(f"\n{'='*55}")
    print(f"[AFFINOVA EMAIL] To: {to_email}")
    print(f"[AFFINOVA EMAIL] Verification Code: {otp_code}")
    print(f"[AFFINOVA EMAIL] (Configure GMAIL_APP_PASSWORD in .env for real email)")
    print(f"{'='*55}\n")
    return False


def send_password_reset_email(to_email: str, full_name: str, reset_code: str) -> bool:
    """Send password reset OTP."""
    first_name = full_name.split()[0] if full_name else "there"
    content = f"""
    <p class="greeting">Password Reset Request</p>
    <p class="text">
      Hi {first_name}, we received a request to reset your Affinova password.
      Use the code below to reset your password.
    </p>
    <div class="otp-box">
      <div class="otp">{reset_code}</div>
      <div class="otp-label">Password Reset Code</div>
    </div>
    <div class="expiry">
      ⏱ This code expires in <strong>15 minutes</strong>.
    </div>
    <p class="text warn">
      If you did NOT request a password reset, please contact support immediately.
      Your account may be at risk.
    </p>
    """
    subject = "Affinova — Password Reset Code"
    if _is_configured():
        success = _send_smtp(to_email, subject, _base_template(content))
        if success:
            print(f"[AFFINOVA EMAIL] Password reset email sent to {to_email}")
            return True
    print(f"\n[AFFINOVA PASSWORD RESET] To: {to_email} | Code: {reset_code}\n")
    return False


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """Send welcome email after successful verification."""
    first_name = full_name.split()[0] if full_name else "there"
    content = f"""
    <p class="greeting">You're in, {first_name}!</p>
    <p class="text">
      Your Affinova account is now fully verified and ready to use.
      Start creating affiliate links, tracking clicks, and earning commissions today.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a class="btn" href="http://127.0.0.1:8000/login.html">Go to Dashboard</a>
    </div>
    <hr class="divider"/>
    <p class="text" style="font-size:13px;">
      <strong style="color:#2ee6a6;">What's next?</strong><br/>
      &bull; Complete your profile<br/>
      &bull; Create your first affiliate link<br/>
      &bull; Share it and start tracking clicks<br/>
      &bull; Upgrade your plan to unlock more features
    </p>
    """
    subject = "Welcome to Affinova — Your account is ready!"
    if _is_configured():
        success = _send_smtp(to_email, subject, _base_template(content))
        if success:
            print(f"[AFFINOVA EMAIL] Welcome email sent to {to_email}")
            return True
    print(f"[AFFINOVA EMAIL] Welcome email (not sent — SMTP not configured) for {to_email}")
    return False


def send_payout_confirmation_email(to_email: str, full_name: str, amount: float, method: str) -> bool:
    """Send payout request confirmation."""
    first_name = full_name.split()[0] if full_name else "there"
    content = f"""
    <p class="greeting">Payout Request Received</p>
    <p class="text">
      Hi {first_name}, your payout request has been received and is being processed.
    </p>
    <div class="otp-box" style="text-align:left;padding:20px 24px;">
      <table style="width:100%;color:#e8ecf4;font-size:15px;">
        <tr><td style="color:#6b7a9a;padding:6px 0;">Amount</td><td style="font-weight:700;color:#2ee6a6;">&#8377;{amount:.2f}</td></tr>
        <tr><td style="color:#6b7a9a;padding:6px 0;">Method</td><td>{method.upper()}</td></tr>
        <tr><td style="color:#6b7a9a;padding:6px 0;">Status</td><td><span style="color:#ffb020;">Pending Review</span></td></tr>
      </table>
    </div>
    <p class="text">
      Our team will process your payout within 3–5 business days.
      You will receive a confirmation once the payment is transferred.
    </p>
    """
    subject = f"Affinova — Payout Request of ₹{amount:.2f} Received"
    if _is_configured():
        success = _send_smtp(to_email, subject, _base_template(content))
        if success:
            print(f"[AFFINOVA EMAIL] Payout confirmation sent to {to_email}")
            return True
    print(f"[AFFINOVA EMAIL] Payout confirmation (not sent) for {to_email}, amount: {amount}")
    return False
