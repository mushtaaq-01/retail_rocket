from fastapi.testclient import TestClient
from main import app, user_to_index

client = TestClient(app)

def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Retail AI Recommendation API",
        "status": "running"
    }

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "users" in data
    assert "products" in data

def test_recommendation():
    sample_visitor_id = list(user_to_index.keys())[0]
    response = client.get(f"/recommend/{sample_visitor_id}?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["visitor_id"] == sample_visitor_id
    assert len(data["recommendations"]) == 5

def test_recommendation_invalid_user():
    response = client.get("/recommend/invalid_visitor_999999999")
    assert response.status_code == 404

if __name__ == "__main__":
    test_home()
    test_health()
    test_recommendation()
    test_recommendation_invalid_user()
    print("All tests passed successfully!")
