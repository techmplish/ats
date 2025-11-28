import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.db import Database
from app.routes.auth import token_required

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/upload', methods=['POST'])
@token_required
def upload_resume():
    """
    Upload a resume file
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
        description: The resume file to upload
      - in: formData
        name: candidate_id
        type: integer
        required: false
        description: Optional candidate ID to link the resume to
    responses:
      201:
        description: File uploaded successfully
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
        
        # In a real app, we would parse the resume here.
        # For now, we'll just create a placeholder candidate or link to one if provided.
        
        # If candidate_id is provided, link it. Otherwise try to infer from logged in user.
        candidate_id = request.form.get('candidate_id')
        
        if not candidate_id:
            from flask import g
            # Try to find candidate linked to this user
            user_email_row = Database.query("SELECT email FROM users WHERE id = %s", (g.user_id,), fetchone=True)
            if user_email_row:
                email = user_email_row[0]
                cand_row = Database.query("SELECT id FROM candidates WHERE email = %s", (email,), fetchone=True)
                if cand_row:
                    candidate_id = cand_row[0]
        
        if candidate_id:
            try:
                Database.execute(
                    "INSERT INTO resumes (candidate_id, file_path, file_name) VALUES (%s, %s, %s)",
                    (candidate_id, file_path, filename)
                )
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        
        return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 201
