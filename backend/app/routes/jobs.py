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
        jobs = JobService.get_all_jobs()
        return jsonify(jobs), 200
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
