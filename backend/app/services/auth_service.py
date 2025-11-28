import bcrypt
import jwt
import datetime
from flask import current_app
from app.db import Database

class AuthService:
    @staticmethod
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def check_password(password, hashed):
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    @staticmethod
    def generate_token(user_id, role):
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id,
            'role': role
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

    @staticmethod
    def register_user(email, password, first_name, last_name, role_name='user'):
        # Check if user exists
        existing = Database.query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
        if existing:
            raise ValueError("User already exists")

        # Get role ID
        role = Database.query("SELECT id FROM roles WHERE name = %s", (role_name,), fetchone=True)
        if not role:
            # Fallback or error - ensure roles exist via init.sql
            raise ValueError(f"Role '{role_name}' not found")
        
        role_id = role[0]
        hashed_pw = AuthService.hash_password(password)

        # Insert user
        Database.execute(
            """
            INSERT INTO users (email, password_hash, first_name, last_name, role_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (email, hashed_pw, first_name, last_name, role_id)
        )
        
        # Get the new user ID
        user = Database.query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
        return user[0]

    @staticmethod
    def login_user(email, password):
        user = Database.query(
            """
            SELECT u.id, u.password_hash, r.name as role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = %s
            """, 
            (email,), 
            fetchone=True
        )
        
        if not user:
            raise ValueError("Invalid credentials")
        
        user_id, password_hash, role_name = user
        
        if not AuthService.check_password(password, password_hash):
            raise ValueError("Invalid credentials")
            
        token = AuthService.generate_token(user_id, role_name)
        return {'token': token, 'role': role_name, 'user_id': user_id}

    @staticmethod
    def get_user_by_id(user_id):
        return Database.query(
            """
            SELECT u.id, u.email, u.first_name, u.last_name, r.name as role 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = %s
            """,
            (user_id,),
            fetchone=True
        )
