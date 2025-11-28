from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from functools import wraps
import jwt
from flask import current_app, g

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            print("Token missing in header")
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            print(f"Decoding token: {token[:10]}...")
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            g.user_id = data['sub']
            g.user_role = data['role']
        except Exception as e:
            print(f"Token invalid: {e}")
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.user_role != 'admin':
            return jsonify({'message': 'Admin privilege required'}), 403
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
            - first_name
            - last_name
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: password123
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
    responses:
      201:
        description: User registered successfully
      400:
        description: User already exists or invalid input
      500:
        description: Internal server error
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    
    if not email or not password or not first_name or not last_name:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        user_id = AuthService.register_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role_name=data.get('role', 'user') # Allow setting role for dev/demo purposes
        )
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login a user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: password123
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            token:
              type: string
            role:
              type: string
            user_id:
              type: integer
      400:
        description: Invalid credentials
      500:
        description: Internal server error
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
        
    try:
        result = AuthService.login_user(
            email=email,
            password=password
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    try:
        user = AuthService.get_user_by_id(g.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            'id': user[0],
            'email': user[1],
            'first_name': user[2],
            'last_name': user[3],
            'role': user[4]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
