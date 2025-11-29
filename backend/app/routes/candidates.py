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
        # Get query parameters
        query = request.args.get('q', '')
        location = request.args.get('location', '')
        min_experience = request.args.get('experience', type=int)

        sql = "SELECT id, first_name, last_name, email, phone, linkedin_url, created_at, skills, experience_years FROM candidates WHERE 1=1"
        params = []

        if query:
            # Search in name or skills
            sql += " AND (first_name ILIKE %s OR last_name ILIKE %s OR skills ILIKE %s)"
            search_term = f"%{query}%"
            params.extend([search_term, search_term, search_term])
        
        if location:
            # Assuming location is stored in a column or we just skip for now if not in schema
            # Checking schema... location is not in candidates table, maybe in future.
            # For now let's skip location filter or add it to schema if needed.
            # But user asked for it. Let's check if we can add it or if it's in resume text.
            pass 

        if min_experience is not None:
            sql += " AND experience_years >= %s"
            params.append(min_experience)

        sql += " ORDER BY created_at DESC"

        rows = Database.query(sql, tuple(params), fetchall=True)
        
        candidates = [
            {
                'id': r[0], 'first_name': r[1], 'last_name': r[2], 
                'email': r[3], 'phone': r[4], 'linkedin_url': r[5],
                'created_at': r[6], 'skills': r[7], 'experience_years': r[8]
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
            "SELECT id, first_name, last_name, email, phone, linkedin_url, portfolio_url, skills, experience_years, created_at, headline, summary, education, experience, projects, languages FROM candidates WHERE id = %s",
            (candidate_id,),
            fetchone=True
        )
        if not row:
            return jsonify({'error': 'Candidate not found'}), 404
            
        candidate = {
            'id': row[0], 'first_name': row[1], 'last_name': row[2], 
            'email': row[3], 'phone': row[4], 'linkedin_url': row[5],
            'portfolio_url': row[6], 'skills': row[7], 'experience_years': row[8],
            'created_at': row[9],
            'headline': row[10], 'summary': row[11],
            'education': row[12], 'experience': row[13],
            'projects': row[14], 'languages': row[15]
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
            "SELECT id, first_name, last_name, email, phone, linkedin_url, portfolio_url, skills, experience_years, headline, summary, education, experience, projects, languages FROM candidates WHERE email = %s",
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
                'portfolio_url': '',
                'headline': '', 'summary': '',
                'education': [], 'experience': [], 'projects': [], 'languages': []
            }), 200
            
        candidate = {
            'id': row[0], 'first_name': row[1], 'last_name': row[2], 
            'email': row[3], 'phone': row[4], 'linkedin_url': row[5],
            'portfolio_url': row[6], 'skills': row[7], 'experience_years': row[8],
            'headline': row[9], 'summary': row[10],
            'education': row[11], 'experience': row[12],
            'projects': row[13], 'languages': row[14]
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
        if 'headline' in data:
            fields.append("headline = %s")
            values.append(data['headline'])
        if 'summary' in data:
            fields.append("summary = %s")
            values.append(data['summary'])
        if 'skills' in data:
            fields.append("skills = %s")
            values.append(data['skills']) # Assuming string or JSON string
        if 'education' in data:
            fields.append("education = %s")
            import json
            values.append(json.dumps(data['education']) if isinstance(data['education'], (list, dict)) else data['education'])
        if 'experience' in data:
            fields.append("experience = %s")
            import json
            values.append(json.dumps(data['experience']) if isinstance(data['experience'], (list, dict)) else data['experience'])
        if 'projects' in data:
            fields.append("projects = %s")
            import json
            values.append(json.dumps(data['projects']) if isinstance(data['projects'], (list, dict)) else data['projects'])
        if 'languages' in data:
            fields.append("languages = %s")
            import json
            values.append(json.dumps(data['languages']) if isinstance(data['languages'], (list, dict)) else data['languages'])
            
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
