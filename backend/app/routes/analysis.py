from flask import Blueprint, request, jsonify
from app.db import Database
from app.routes.auth import token_required

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/<int:app_id>', methods=['GET'])
@token_required
def get_analysis(app_id):
    """
    Get analysis results for an application
    ---
    tags:
      - AI Analysis
    security:
      - Bearer: []
    parameters:
      - name: app_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Analysis details
      404:
        description: No analysis found
      500:
        description: Internal server error
    """
    try:
        row = Database.query(
            """
            SELECT match_score, analysis_text, keywords_matched, missing_keywords, created_at 
            FROM analysis_results 
            WHERE application_id = %s 
            ORDER BY created_at DESC
            """,
            (app_id,),
            fetchone=True
        )
        if not row:
            return jsonify({'message': 'No analysis found'}), 404
            
        return jsonify({
            'match_score': row[0],
            'analysis_text': row[1],
            'keywords_matched': row[2],
            'missing_keywords': row[3],
            'created_at': row[4]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
