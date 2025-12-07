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
        
        # Parse the resume
        from app.services.parsing.resume_parser import ResumeParser
        parsed_data = ResumeParser.parse_resume(file_path)
        
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
                # Update candidate skills/experience if missing or if we want to append
                if parsed_data.get('skills') or parsed_data.get('experience_years'):
                    # Fetch current data
                    curr = Database.query("SELECT skills, experience_years FROM candidates WHERE id = %s", (candidate_id,), fetchone=True)
                    if curr:
                        current_skills = curr[0] or ""
                        current_exp = curr[1] or 0
                        
                        new_skills = parsed_data.get('skills', [])
                        if isinstance(new_skills, list):
                            new_skills = ", ".join(new_skills)
                        
                        # Merge skills (simple concatenation for now, or overwrite if empty)
                        final_skills = current_skills
                        if new_skills:
                            if final_skills:
                                final_skills += ", " + new_skills
                            else:
                                final_skills = new_skills
                        
                        # Update experience if new one is found and greater (or just take new one)
                        new_exp = parsed_data.get('experience_years', 0)
                        final_exp = max(current_exp, new_exp)
                        
                        Database.execute(
                            "UPDATE candidates SET skills = %s, experience_years = %s WHERE id = %s",
                            (final_skills, final_exp, candidate_id)
                        )



                # Resume Versioning Logic: Check count before inserting
                existing_resumes = Database.query(
                    "SELECT id, file_path FROM resumes WHERE candidate_id = %s ORDER BY uploaded_at ASC",
                    (candidate_id,),
                    fetchall=True
                )
                
                if existing_resumes and len(existing_resumes) >= 3:
                    # Delete the oldest ones until we have space for the new one (keep 2, so new one makes 3)
                    # Actually requirement says "As soon as candidate enters 4th... 1st should get deleted"
                    # So if we have 3, we delete the oldest 1.
                    
                    # Calculate how many to delete. We want (current + 1) <= 3 is impossible if current is 3. 
                    # So if current is 3, we delete 1. If current is 4 (error state), we delete 2.
                    num_to_delete = len(existing_resumes) - 2 
                    
                    to_delete = existing_resumes[:num_to_delete]
                    
                    for res in to_delete:
                        res_id = res[0]
                        res_path = res[1]
                        
                        # Delete from DB
                        Database.execute("DELETE FROM resumes WHERE id = %s", (res_id,))
                        
                        # Delete from Disk
                        if os.path.exists(res_path):
                            try:
                                os.remove(res_path)
                                print(f"Deleted old resume version: {res_path}")
                            except Exception as del_err:
                                print(f"Error deleting file {res_path}: {del_err}")
                    
                    # Notify user (Mock notification via print for now, frontend will see updated list)
                    print(f"Notification: Old versions of resume were deleted to save space.")

                Database.execute(
                    "INSERT INTO resumes (candidate_id, file_path, file_name, parsed_text) VALUES (%s, %s, %s, %s)",
                    (candidate_id, file_path, filename, parsed_data.get('text', ''))
                )
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        
        return jsonify({
            'message': 'File uploaded successfully', 
            'file_path': file_path,
            'parsed_data': parsed_data
        }), 201


@resume_bp.route('/history/<int:candidate_id>', methods=['GET'])
@token_required
def get_resume_history(candidate_id):
    """
    Get upload history of resumes for a candidate
    ---
    tags:
      - Files
    security:
      - Bearer: []
    parameters:
      - name: candidate_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: List of resume versions
      500:
        description: Internal server error
    """
    try:
        rows = Database.query(
            "SELECT id, file_name, uploaded_at FROM resumes WHERE candidate_id = %s ORDER BY uploaded_at DESC",
            (candidate_id,),
            fetchall=True
        )
        
        history = [
            {
                'id': r[0],
                'file_name': r[1],
                'uploaded_at': r[2].isoformat() if r[2] else None
            }
            for r in rows
        ]
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/download/<int:candidate_id>', methods=['GET'])
@token_required
def download_resume(candidate_id):
    """
    Download the latest resume for a candidate
    ---
    tags:
      - Files
    security:
      - Bearer: []
    parameters:
      - name: candidate_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Resume file
      404:
        description: Resume not found
      500:
        description: Internal server error
    """
    try:
        # Get latest resume
        row = Database.query(
            "SELECT file_path, file_name FROM resumes WHERE candidate_id = %s ORDER BY uploaded_at DESC LIMIT 1",
            (candidate_id,),
            fetchone=True
        )
        
        if not row:
            return jsonify({'error': 'Resume not found'}), 404
            
        file_path = row[0]
        file_name = row[1]
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found on server'}), 404
            
        from flask import send_file
        return send_file(file_path, as_attachment=True, download_name=file_name)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
