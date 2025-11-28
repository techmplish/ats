import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.db import Database
from app.routes.auth import token_required

jd_bp = Blueprint('jd', __name__)

@jd_bp.route('/upload', methods=['POST'])
@token_required
def upload_jd():
    """
    Upload a Job Description file
    ---
    tags:
      - Files
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: The JD file to upload
      - in: formData
        name: job_id
        type: integer
        required: false
        description: Optional job ID to link the JD to
    responses:
      201:
        description: JD uploaded successfully
      400:
        description: No file part or no selected file
      500:
        description: Internal server error
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        job_id = request.form.get('job_id')
        if job_id:
            try:
                Database.execute(
                    "INSERT INTO jd_files (job_id, file_path, file_name) VALUES (%s, %s, %s)",
                    (job_id, file_path, filename)
                )
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        
        return jsonify({'message': 'JD uploaded successfully', 'file_path': file_path}), 201
