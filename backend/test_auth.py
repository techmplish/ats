from app import create_app
from app.services.auth_service import AuthService
import sys

app = create_app()
with app.app_context():
    try:
        print("Attempting to register user...")
        # Use a random email to avoid collision if run multiple times
        import random
        email = f"debug_{random.randint(1000,9999)}@test.com"
        uid = AuthService.register_user(email, "pass", "Debug", "User")
        print(f"Success! User ID: {uid}")
    except Exception as e:
        print("Error occurred:")
        import traceback
        traceback.print_exc()
