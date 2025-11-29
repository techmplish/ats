from flask import Blueprint, request, jsonify, g
from app.services.candidate_service import CandidateService
from app.routes.auth import token_required

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/board', methods=['GET'])
@token_required
def get_board():
    """
    Get application board data (Kanban view)
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    responses:
      200:
        description: List of applications grouped by stage
      500:
        description: Internal server error
    """
    try:
        apps = CandidateService.get_applications_board()
        return jsonify(apps), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route('', methods=['GET'])
@token_required
def get_all_applications():
    """
    Get all applications
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    responses:
      200:
        description: List of all applications
      500:
        description: Internal server error
    """
    # Reusing board logic for list view for now, can be specialized later
    try:
        apps = CandidateService.get_applications_board()
        return jsonify(apps), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route('/me', methods=['GET'])
@token_required
def get_my_applications():
    """
    Get current candidate's applications
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    responses:
      200:
        description: List of applications
      404:
        description: Candidate not found
      500:
        description: Internal server error
    """
    try:
        from flask import g
        from app.db import Database
        
        # Get user email
        user = Database.query("SELECT email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        email = user[0]

        # Find candidate by email
        cand = Database.query("SELECT id FROM candidates WHERE email = %s", (email,), fetchone=True)
        if not cand:
            return jsonify([]), 200 # No candidate profile means no applications
            
        candidate_id = cand[0]
        
        # Fetch applications with job details
        # We need job title, company (hardcoded for now or from job?), status, dates
        # Assuming jobs table has title. Company is usually the tenant, let's assume 'Techmplish Inc.' or fetch if in jobs table.
        # Checking schema... jobs table has title, location, department. No company column (single tenant ATS).
        
        rows = Database.query(
            """
            SELECT a.id, j.title, a.stage, a.applied_at, a.updated_at
            FROM applications a
            JOIN job_postings j ON a.job_id = j.id
            WHERE a.candidate_id = %s
            ORDER BY a.applied_at DESC
            """,
            (candidate_id,),
            fetchall=True
        )
        
        applications = [
            {
                'id': r[0],
                'job_title': r[1],
                'company': 'Techmplish Inc.', # Static for now
                'status': r[2],
                'applied_at': r[3].strftime('%Y-%m-%d') if r[3] else '',
                'last_update': r[4].strftime('%Y-%m-%d') if r[4] else ''
            }
            for r in rows
        ]
        
        return jsonify(applications), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route('/<int:app_id>', methods=['GET'])
@token_required
def get_application(app_id):
    """
    Get application details
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    parameters:
      - name: app_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Application details
      404:
        description: Application not found
      500:
        description: Internal server error
    """
    try:
        app = CandidateService.get_application_details(app_id)
        if not app:
            return jsonify({'error': 'Application not found'}), 404
        return jsonify(app), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route('/<int:app_id>/stage', methods=['PUT'])
@token_required
def update_stage(app_id):
    """
    Update application stage
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    parameters:
      - name: app_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - stage
          properties:
            stage:
              type: string
              example: Interview
    responses:
      200:
        description: Stage updated
      400:
        description: Stage is required
      500:
        description: Internal server error
    """
    data = request.get_json()
    stage = data.get('stage')
    if not stage:
        return jsonify({'error': 'Stage is required'}), 400
        
    try:
        CandidateService.update_application_stage(app_id, stage)
        return jsonify({'message': 'Stage updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route('', methods=['POST'])
@token_required
def create_application():
    """
    Create a new application
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - job_id
            - candidate
          properties:
            job_id:
              type: integer
            candidate:
              type: object
              properties:
                first_name:
                  type: string
                last_name:
                  type: string
                email:
                  type: string
    responses:
      201:
        description: Application created
      400:
        description: Invalid input
      500:
        description: Internal server error
    """
    data = request.get_json()
    try:
        # Check if user is logged in and is a candidate
        from flask import g
        from app.db import Database
        
        candidate_id = None
        
        # If logged in, try to find candidate_id
        if hasattr(g, 'user_id'):
            user = Database.query("SELECT email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
            if user:
                email = user[0]
                cand = Database.query("SELECT id FROM candidates WHERE email = %s", (email,), fetchone=True)
                if cand:
                    candidate_id = cand[0]
        
        # If not found via login, check if provided in body (for public applications or admin creation)
        if not candidate_id and 'candidate' in data:
             candidate_id = CandidateService.create_candidate(data['candidate'])
             
        if not candidate_id and hasattr(g, 'user_id'):
            # Auto-create candidate profile for logged in user if it doesn't exist
            user_details = Database.query("SELECT first_name, last_name, email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
            if user_details:
                Database.execute(
                    "INSERT INTO candidates (first_name, last_name, email) VALUES (%s, %s, %s) RETURNING id",
                    (user_details[0], user_details[1], user_details[2])
                )
                # We need to fetch the ID we just created. Since execute doesn't return it in this helper:
                cand_new = Database.query("SELECT id FROM candidates WHERE email = %s", (user_details[2],), fetchone=True)
                if cand_new:
                    candidate_id = cand_new[0]

        if not candidate_id:
            return jsonify({'error': 'Candidate profile not found. Please complete your profile first.'}), 400

        # Create application
        # Check if already applied
        existing = Database.query("SELECT id, status FROM applications WHERE job_id = %s AND candidate_id = %s", (data['job_id'], candidate_id), fetchone=True)
        if existing:
            # If withdrawn, allow re-application by updating status
            if existing[1] == 'Withdrawn':
                Database.execute("UPDATE applications SET status = 'Applied', applied_at = NOW() WHERE id = %s", (existing[0],))
                return jsonify({'message': 'Application resubmitted successfully'}), 201
            return jsonify({'error': 'You have already applied for this job'}), 400
            
        CandidateService.create_application(data['job_id'], candidate_id)
        return jsonify({'message': 'Application submitted successfully'}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@applications_bp.route('/<int:app_id>/withdraw', methods=['PUT'])
@token_required
def withdraw_application(app_id):
    """
    Withdraw an application
    ---
    tags:
      - Applications
    security:
      - Bearer: []
    parameters:
      - name: app_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Application withdrawn
      500:
        description: Internal server error
    """
    try:
        from app.db import Database
        # Verify ownership (optional but recommended)
        # For now, just update status
        Database.execute("UPDATE applications SET status = 'Withdrawn' WHERE id = %s", (app_id,))
        return jsonify({'message': 'Application withdrawn successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
