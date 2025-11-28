from flask import Blueprint, request, jsonify
from app.services.rag_service import RAGService
from app.routes.auth import token_required

rag_bp = Blueprint('rag', __name__)

@rag_bp.route('/analyze/<int:app_id>', methods=['POST'])
@token_required
def analyze_application(app_id):
    """
    Trigger AI analysis for an application
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
        description: Analysis completed
      500:
        description: Internal server error
    """
    # This would normally trigger the LLM analysis
    # For now, we'll mock the LLM part but save to DB as required
    try:
        # Mock analysis result
        import random
        score = random.randint(60, 95)
        text = "Candidate has strong Python skills but lacks recent cloud experience."
        keywords = "Python, Flask, SQL"
        missing = "AWS, Docker"
        
        RAGService.save_analysis(app_id, score, text, keywords, missing)
        
        # Also update application score
        from app.db import Database
        Database.execute("UPDATE applications SET score = %s WHERE id = %s", (score, app_id))
        
        return jsonify({'message': 'Analysis completed', 'score': score}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rag_bp.route('/ask', methods=['POST'])
@token_required
def ask():
    """
    Ask a question to the AI Assistant
    ---
    tags:
      - AI Analysis
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - question
          properties:
            question:
              type: string
              example: "Show me candidates with Python experience"
    responses:
      200:
        description: AI response
      400:
        description: Question is required
      500:
        description: Internal server error
    """
    data = request.get_json()
    question = data.get('question')
    if not question:
        return jsonify({'error': 'Question is required'}), 400
        
    try:
        # Mock RAG response for now as we don't have the vector DB setup in this raw SQL version yet
        # In a real implementation, this would query the vector DB
        answer = f"This is a mock AI response to: {question}. (RAG not fully implemented in raw SQL mode yet)"
        return jsonify({'answer': answer, 'sources': []}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
