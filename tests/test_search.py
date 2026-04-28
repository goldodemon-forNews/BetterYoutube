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


def test_search_requires_query(client):
    response = client.get("/api/search")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_search_with_query(client):
    response = client.get("/api/search?q=python")
    assert response.status_code == 200


def test_trending_endpoint(client):
    response = client.get("/api/trending")
    assert response.status_code == 200
