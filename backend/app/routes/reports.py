from flask import Blueprint, jsonify
from app.services.report_service import ReportService
from app.routes.auth import token_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/pipeline-summary', methods=['GET'])
@token_required
def get_pipeline_summary():
    try:
        from flask import request
        filters = {
            'job_id': request.args.get('job_id'),
            'location': request.args.get('location'),
            'department': request.args.get('department'),
            'coy_name': request.args.get('company')
        }
        # Remove None values
        filters = {k: v for k, v in filters.items() if v}
        
        data = ReportService.get_pipeline_summary(filters)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/job-stats', methods=['GET'])
@token_required
def get_job_stats():
    try:
        data = ReportService.get_job_stats()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
