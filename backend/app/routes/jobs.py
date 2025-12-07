from flask import Blueprint, request, jsonify, g
from app.services.job_service import JobService
from app.routes.auth import token_required

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('', methods=['GET'])
def get_jobs():
    """
    Get all job postings
    ---
    tags:
      - Jobs
    responses:
      200:
        description: List of all jobs
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
              title:
                type: string
              department:
                type: string
              location:
                type: string
              status:
                type: string
      500:
        description: Internal server error
    """
    try:
        # Check for token manually to support optional auth
        from flask import current_app
        import jwt
        from app.db import Database
        
        candidate_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                # Manual decode
                data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
                user_id = data['sub']
                
                # Get candidate_id for this user
                # Ensure user_id is valid integer
                user_id = int(user_id)
                cand = Database.query("SELECT id FROM candidates WHERE email = (SELECT email FROM users WHERE id=%s)", (user_id,), fetchone=True)
                if cand:
                    candidate_id = cand[0]
            except Exception as e:
                # print(f"Token decode failed in jobs: {e}")
                pass # Ignore invalid tokens for public view
                
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        
        result = JobService.get_all_jobs(candidate_id, page, limit, status)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """
    Get a specific job by ID
    ---
    tags:
      - Jobs
    parameters:
      - name: job_id
        in: path
        type: integer
        required: true
        description: ID of the job to fetch
    responses:
      200:
        description: Job details
      404:
        description: Job not found
      500:
        description: Internal server error
    """
    try:
        job = JobService.get_job_by_id(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        return jsonify(job), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('', methods=['POST'])
@token_required
def create_job():
    """
    Create a new job posting
    ---
    tags:
      - Jobs
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - title
            - department
            - location
            - description
            - requirements
          properties:
            title:
              type: string
            department:
              type: string
            location:
              type: string
            description:
              type: string
            requirements:
              type: string
    responses:
      201:
        description: Job created successfully
      400:
        description: Missing required fields
      500:
        description: Internal server error
    """
    data = request.get_json()
    # Basic validation
    required = ['title', 'department', 'location', 'description', 'requirements']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400
        
    try:
        JobService.create_job(data, g.user_id)
        return jsonify({'message': 'Job created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/<int:job_id>', methods=['PUT'])
@token_required
def update_job(job_id):
    """
    Update an existing job
    ---
    tags:
      - Jobs
    security:
      - Bearer: []
    parameters:
      - name: job_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            department:
              type: string
            location:
              type: string
            description:
              type: string
            requirements:
              type: string
            status:
              type: string
    responses:
      200:
        description: Job updated successfully
      500:
        description: Internal server error
    """
    data = request.get_json()
    try:
        JobService.update_job(job_id, data)
        return jsonify({'message': 'Job updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@token_required
def delete_job(job_id):
    """
    Delete a job
    ---
    tags:
      - Jobs
    security:
      - Bearer: []
    parameters:
      - name: job_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Job deleted successfully
      500:
        description: Internal server error
    """
    try:
        JobService.delete_job(job_id)
        return jsonify({'message': 'Job deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/<int:job_id>/applications', methods=['GET'])
@token_required
def get_job_applications(job_id):
    """
    Get all applications for a specific job
    ---
    tags:
      - Jobs
    security:
      - Bearer: []
    parameters:
      - name: job_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of applications
      500:
        description: Internal server error
    """
    try:
        from app.db import Database
        rows = Database.query("""
            SELECT a.id, c.first_name, c.last_name, c.email, a.status, a.applied_at, c.id
            FROM applications a
            JOIN candidates c ON a.candidate_id = c.id
            WHERE a.job_id = %s
            ORDER BY a.applied_at DESC
        """, (job_id,), fetchall=True)
        
        apps = []
        for r in rows:
            apps.append({
                'id': r[0],
                'candidate_name': f"{r[1]} {r[2]}",
                'email': r[3],
                'status': r[4],
                'applied_at': r[5],
                'candidate_id': r[6]
            })
        return jsonify(apps), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
