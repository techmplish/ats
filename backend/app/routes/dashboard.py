from flask import Blueprint, jsonify
from app.db import Database
from app.routes.auth import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_stats():
    """
    Get dashboard statistics
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    responses:
      200:
        description: Dashboard metrics
        schema:
          type: object
          properties:
            total_candidates:
              type: integer
            active_jobs:
              type: integer
            total_applications:
              type: integer
            interviews_scheduled:
              type: integer
            recent_applications:
              type: array
      500:
        description: Internal server error
    """
    try:
        # Total Candidates
        res_cand = Database.query("SELECT COUNT(*) FROM candidates", fetchone=True)
        total_candidates = res_cand[0] if res_cand else 0

        # Active Jobs (assuming all are active for now, or check status if column exists)
        # We'll just count all jobs for simplicity unless status column is confirmed
        res_jobs = Database.query("SELECT COUNT(*) FROM job_postings", fetchone=True)
        active_jobs = res_jobs[0] if res_jobs else 0

        # Total Applications
        res_apps = Database.query("SELECT COUNT(*) FROM applications", fetchone=True)
        total_applications = res_apps[0] if res_apps else 0

        # Interviews (Applications in 'Interview' stage)
        res_int = Database.query("SELECT COUNT(*) FROM applications WHERE status = 'Interview'", fetchone=True)
        interviews = res_int[0] if res_int else 0

        # Recent Applications (Limit 5)
        recent_apps_rows = Database.query("""
            SELECT a.id, c.first_name, c.last_name, j.title, a.status, a.created_at 
            FROM applications a
            JOIN candidates c ON a.candidate_id = c.id
            JOIN job_postings j ON a.job_id = j.id
            ORDER BY a.created_at DESC LIMIT 5
        """, fetchall=True)
        
        recent_apps = []
        for r in recent_apps_rows:
            recent_apps.append({
                'id': r[0],
                'candidate_name': f"{r[1]} {r[2]}",
                'job_title': r[3],
                'status': r[4],
                'created_at': r[5]
            })

        return jsonify({
            'total_candidates': total_candidates,
            'active_jobs': active_jobs,
            'total_applications': total_applications,
            'interviews_scheduled': interviews,
            'recent_applications': recent_apps
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/candidate-stats', methods=['GET'])
@token_required
def get_candidate_stats():
    """
    Get candidate dashboard statistics
    ---
    tags:
      - Dashboard
    security:
      - Bearer: []
    responses:
      200:
        description: Candidate dashboard metrics
      500:
        description: Internal server error
    """
    try:
        from flask import g
        print(f"DEBUG: Fetching stats for user_id: {g.user_id}")
        
        # Get user email to find candidate record
        user = Database.query("SELECT email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
        if not user:
            print("DEBUG: User not found")
            return jsonify({'error': 'User not found'}), 404
        email = user[0]
        print(f"DEBUG: Found email: {email}")

        # Find candidate by email
        candidate = Database.query("SELECT id, first_name, last_name, skills, experience_years, linkedin_url FROM candidates WHERE email = %s", (email,), fetchone=True)
        
        if not candidate:
            print("DEBUG: Candidate not found")
            # If no candidate record exists yet, return empty stats
            return jsonify({
                'applications_submitted': 0,
                'interviews_scheduled': 0,
                'profile_completeness': 0,
                'recent_applications': []
            }), 200

        candidate_id = candidate[0]
        print(f"DEBUG: Found candidate_id: {candidate_id}")

        # Calculate Profile Completeness
        # Basic logic: 20% for basic info (implied by record existence), +20% for skills, +20% for experience, +20% for linkedin, +20% for resume (check resumes table)
        completeness = 20
        if candidate[3]: completeness += 20 # skills
        if candidate[4]: completeness += 20 # experience
        if candidate[5]: completeness += 20 # linkedin
        
        resume = Database.query("SELECT id FROM resumes WHERE candidate_id = %s", (candidate_id,), fetchone=True)
        if resume: completeness += 20

        # Applications Submitted
        res_apps = Database.query("SELECT COUNT(DISTINCT job_id) FROM applications WHERE candidate_id = %s AND status != 'Withdrawn'", (candidate_id,), fetchone=True)
        total_applications = res_apps[0] if res_apps else 0
        print(f"DEBUG: Total applications: {total_applications}")

        # Interviews
        res_int = Database.query("SELECT COUNT(*) FROM applications WHERE candidate_id = %s AND status = 'Interview'", (candidate_id,), fetchone=True)
        interviews = res_int[0] if res_int else 0

        # Recent Applications
        recent_apps_rows = Database.query("""
            SELECT a.id, j.title, j.department, a.status, a.applied_at 
            FROM applications a
            JOIN job_postings j ON a.job_id = j.id
            WHERE a.candidate_id = %s
            ORDER BY a.applied_at DESC LIMIT 5
        """, (candidate_id,), fetchall=True)
        print(f"DEBUG: Recent apps count: {len(recent_apps_rows) if recent_apps_rows else 0}")
        
        recent_applications = []
        if recent_apps_rows:
            for r in recent_apps_rows:
                recent_applications.append({
                    'id': r[0],
                    'job_title': r[1],
                    'company': 'Techmplish Inc.', # Hardcoded for now as we are single tenant
                    'status': r[3],
                    'created_at': r[4]
                })

        return jsonify({
            'applications_submitted': total_applications,
            'interviews_scheduled': interviews,
            'profile_completeness': completeness,
            'recent_applications': recent_applications
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
