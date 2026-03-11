#!/usr/bin/env python3
"""
Test auth APIs (register, login, me, logout) with cookie/session auth.
Run from project root with backend venv activated:
  cd backend/smart_rental && python scripts/test_auth_api.py
Or set BASE_URL if your server runs elsewhere.
"""
import os
import sys

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8000/api/")

def main():
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"

    # 1. Get CSRF cookie (any GET to the API)
    r = s.get(f"{BASE_URL}auth/login/")
    if r.status_code not in (200, 405):
        print(f"GET login failed: {r.status_code}")
        return
    csrf = s.cookies.get("csrftoken")
    if csrf:
        s.headers["X-CSRFToken"] = csrf

    # 2. Register
    print("Registering user testuser1...")
    r = s.post(
        f"{BASE_URL}auth/register/",
        json={
            "username": "testuser1",
            "password": "testpass123",
            "role": "traveller",
            "email": "test@example.com",
        },
    )
    if r.status_code not in (200, 201):
        print(f"Register failed: {r.status_code} -> {r.text}")
        return
    print("Register OK:", r.json())

    # 3. Me (should be logged in)
    r = s.get(f"{BASE_URL}auth/me/")
    if r.status_code != 200:
        print(f"Me failed: {r.status_code}")
        return
    print("Me OK:", r.json())

    # 4. Logout
    r = s.post(f"{BASE_URL}auth/logout/")
    if r.status_code not in (200, 204):
        print(f"Logout failed: {r.status_code}")
        return
    print("Logout OK")

    # 5. Me again (should be 403)
    r = s.get(f"{BASE_URL}auth/me/")
    print(f"Me after logout: {r.status_code} (expected 403)")

    # 6. Login
    print("Logging in...")
    r = s.get(f"{BASE_URL}auth/login/")  # refresh CSRF after new session
    if s.cookies.get("csrftoken"):
        s.headers["X-CSRFToken"] = s.cookies.get("csrftoken")
    r = s.post(
        f"{BASE_URL}auth/login/",
        json={"username": "testuser1", "password": "testpass123"},
    )
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} -> {r.text}")
        return
    print("Login OK:", r.json())

    print("\nAll auth checks passed.")

if __name__ == "__main__":
    main()
