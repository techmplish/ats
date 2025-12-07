from flask import Blueprint, request, jsonify, g
from app.services.calendar_service import CalendarService
from app.routes.auth import token_required
from datetime import datetime

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/', methods=['GET'])
@token_required
def get_events():
    try:
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        events = CalendarService.get_events(g.user_id, start_date, end_date)
        return jsonify(events), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@calendar_bp.route('/', methods=['POST'])
@token_required
def create_event():
    try:
        data = request.json
        data['organizer_id'] = g.user_id
        
        # Parse dates from ISO string
        if 'start_time' in data:
            data['start_time'] = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        if 'end_time' in data:
            data['end_time'] = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            
        event = CalendarService.create_event(data)
        return jsonify(event), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error creating event: {data}")
        return jsonify({'error': f"Failed to save event: {str(e)}"}), 500
