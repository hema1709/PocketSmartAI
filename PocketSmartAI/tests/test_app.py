import os
os.environ["DATABASE_URL"] = "sqlite:///./test_pocketsmart.db"
os.environ["SECRET_KEY"] = "test-secret-key"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_and_login():
    username = "testuser123"
    email = "testuser123@example.com"
    r = client.post("/register", json={
        "username": username,
        "email": email,
        "password": "StrongPass123!"
    })
    assert r.status_code in (201, 409)

    r = client.post("/login", data={"username": username, "password": "StrongPass123!"})
    assert r.status_code == 200
    assert "access_token" in r.json()
