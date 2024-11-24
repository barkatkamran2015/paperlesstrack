import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True 
    with app.test_client() as client:
        yield client


def test_homepage(client):
    response = client.get('/')
    assert response.status_code == 200 
    assert response.json == {"message": "API is online"}


def test_unrecognized_url(client):
    response = client.get('/unknown')
    assert response.status_code == 404