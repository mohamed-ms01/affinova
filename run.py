import sys
import os

# Set stdout/stderr encoding to UTF-8 on Windows
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend directory is in Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import uvicorn

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("      [+] AFFINOVA NEXT-GEN AFFILIATE MARKETING PLATFORM")
    print("=" * 65)
    print(" * Public Website:        http://127.0.0.1:8000/")
    print(" * Login Page:           http://127.0.0.1:8000/login.html")
    print(" * Registration Page:    http://127.0.0.1:8000/register.html")
    print(" * React User Dashboard: http://127.0.0.1:8000/dashboard/")
    print(" * Admin Panel:          http://127.0.0.1:8000/admin-panel/")
    print(" * Interactive API Docs: http://127.0.0.1:8000/docs")
    print("=" * 65 + "\n")
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")

    try:
        from app.main import app
        uvicorn.run(app, host=host, port=port, reload=False)
    except Exception as e:
        import traceback
        print("\n[CRITICAL ERROR STARTING SERVER]:")
        traceback.print_exc()
        sys.exit(1)
