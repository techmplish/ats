from flask import Blueprint, request, jsonify
from app.db import Database
from app.routes.auth import token_required

candidates_bp = Blueprint('candidates', __name__)

@candidates_bp.route('', methods=['GET'])
@token_required
def get_candidates():
    """
    Get all candidates
    ---
    tags:
      - Candidates
    security:
      - Bearer: []
    responses:
      200:
        description: List of candidates
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              first_name:
                type: string
              last_name:
                type: string
              email:
                type: string
              phone:
                type: string
      500:
        description: Internal server error
    """
    try:
        rows = Database.query(
            "SELECT id, first_name, last_name, email, phone, linkedin_url, created_at FROM candidates ORDER BY created_at DESC",
            fetchall=True
        )
        candidates = [
            {
                'id': r[0], 'first_name': r[1], 'last_name': r[2], 
                'email': r[3], 'phone': r[4], 'linkedin_url': r[5],
                'created_at': r[6]
            }
            for r in rows
        ]
        return jsonify(candidates), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@candidates_bp.route('/<int:candidate_id>', methods=['GET'])
@token_required
def get_candidate(candidate_id):
    """
    Get a specific candidate by ID
    ---
    tags:
      - Candidates
    security:
      - Bearer: []
    parameters:
      - name: candidate_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Candidate details
      404:
        description: Candidate not found
      500:
        description: Internal server error
    """
    try:
        row = Database.query(
            "SELECT id, first_name, last_name, email, phone, linkedin_url, portfolio_url, skills, experience_years, created_at FROM candidates WHERE id = %s",
            (candidate_id,),
            fetchone=True
        )
        if not row:
            return jsonify({'error': 'Candidate not found'}), 404
            
        candidate = {
            'id': row[0], 'first_name': row[1], 'last_name': row[2], 
            'email': row[3], 'phone': row[4], 'linkedin_url': row[5],
            'portfolio_url': row[6], 'skills': row[7], 'experience_years': row[8],
            'created_at': row[9]
        }
        return jsonify(candidate), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@candidates_bp.route('/me', methods=['GET'])
@token_required
def get_current_candidate_profile():
    """
    Get current candidate's profile
    ---
    tags:
      - Candidates
    security:
      - Bearer: []
    responses:
      200:
        description: Candidate profile details
      404:
        description: Candidate not found
      500:
        description: Internal server error
    """
    try:
        from flask import g
        
        # Get user email
        user = Database.query("SELECT email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        email = user[0]

        # Find candidate by email
        row = Database.query(
            "SELECT id, first_name, last_name, email, phone, linkedin_url, portfolio_url, skills, experience_years FROM candidates WHERE email = %s",
            (email,),
            fetchone=True
        )
        
        if not row:
            # Return empty/default profile based on user info
            user_info = Database.query("SELECT first_name, last_name FROM users WHERE id = %s", (g.user_id,), fetchone=True)
            return jsonify({
                'first_name': user_info[0] if user_info else '',
                'last_name': user_info[1] if user_info else '',
                'email': email,
                'phone': '',
                'linkedin_url': '',
                'portfolio_url': ''
            }), 200
            
        candidate = {
            'id': row[0], 'first_name': row[1], 'last_name': row[2], 
            'email': row[3], 'phone': row[4], 'linkedin_url': row[5],
            'portfolio_url': row[6], 'skills': row[7], 'experience_years': row[8]
        }
        return jsonify(candidate), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@candidates_bp.route('/me', methods=['PUT'])
@token_required
def update_candidate_profile():
    """
    Update current candidate's profile
    ---
    tags:
      - Candidates
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            first_name:
              type: string
            last_name:
              type: string
            phone:
              type: string
            linkedin_url:
              type: string
            portfolio_url:
              type: string
    responses:
      200:
        description: Profile updated successfully
      404:
        description: Candidate not found
      500:
        description: Internal server error
    """
    try:
        from flask import g
        data = request.get_json()
        
        # Get user email to find candidate record
        user = Database.query("SELECT email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        email = user[0]

        # Find candidate by email
        candidate = Database.query("SELECT id FROM candidates WHERE email = %s", (email,), fetchone=True)
        
        if not candidate:
            # Create candidate record if it doesn't exist (first time profile update)
            # We need first_name and last_name from user table if not provided in body
            user_details = Database.query("SELECT first_name, last_name FROM users WHERE id = %s", (g.user_id,), fetchone=True)
            
            first_name = data.get('first_name', user_details[0])
            last_name = data.get('last_name', user_details[1])
            phone = data.get('phone', '')
            linkedin_url = data.get('linkedin_url', '')
            portfolio_url = data.get('portfolio_url', '')
            
            Database.execute(
                """
                INSERT INTO candidates (first_name, last_name, email, phone, linkedin_url, portfolio_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (first_name, last_name, email, phone, linkedin_url, portfolio_url)
            )
            return jsonify({'message': 'Profile created successfully'}), 201
        
        candidate_id = candidate[0]
        
        # Update existing record
        fields = []
        values = []
        
        if 'first_name' in data:
            fields.append("first_name = %s")
            values.append(data['first_name'])
        if 'last_name' in data:
            fields.append("last_name = %s")
            values.append(data['last_name'])
        if 'phone' in data:
            fields.append("phone = %s")
            values.append(data['phone'])
        if 'linkedin_url' in data:
            fields.append("linkedin_url = %s")
            values.append(data['linkedin_url'])
        if 'portfolio_url' in data:
            fields.append("portfolio_url = %s")
            values.append(data['portfolio_url'])
            
        if not fields:
            return jsonify({'message': 'No changes provided'}), 200
            
        # Add candidate_id to values for WHERE clause
        values.append(candidate_id)
        
        query = f"UPDATE candidates SET {', '.join(fields)} WHERE id = %s"
        Database.execute(query, tuple(values))
        
        # Also update the users table to keep names in sync
        user_fields = []
        user_values = []
        if 'first_name' in data:
            user_fields.append("first_name = %s")
            user_values.append(data['first_name'])
        if 'last_name' in data:
            user_fields.append("last_name = %s")
            user_values.append(data['last_name'])
            
        if user_fields:
            user_values.append(g.user_id)
            user_query = f"UPDATE users SET {', '.join(user_fields)} WHERE id = %s"
            Database.execute(user_query, tuple(user_values))
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
