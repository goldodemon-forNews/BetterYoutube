import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_get_settings(client):
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.get_json()
    assert "ad_shield_enabled" in data
    assert "interpolation_enabled" in data
    assert "default_resolution" in data


def test_update_settings(client):
    response = client.put(
        "/api/settings",
        json={"ad_shield_enabled": False, "default_resolution": "720p"},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["ad_shield_enabled"] is False
    assert data["default_resolution"] == "720p"


def test_update_settings_no_body(client):
    response = client.put(
        "/api/settings",
        data="",
        content_type="application/json",
    )
    assert response.status_code == 400
