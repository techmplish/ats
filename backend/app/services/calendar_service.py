from app.db import Database

class CalendarService:
    @staticmethod
    def create_event(data):
        """
        Create a new calendar event
        """
        # data = { title, description, start_time, end_time, organizer_id, candidate_id... }
        query = """
            INSERT INTO calendar_events 
            (title, description, start_time, end_time, organizer_id, candidate_id, application_id, job_id, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, title, start_time, end_time
        """
        params = (
            data['title'],
            data.get('description'),
            data['start_time'],
            data['end_time'],
            data['organizer_id'],
            data.get('candidate_id'),
            data.get('application_id'),
            data.get('job_id'),
            data.get('location')
        )
        row = Database.query(query, params, fetchone=True)
        return {'id': row[0], 'title': row[1], 'start_time': row[2], 'end_time': row[3]}

    @staticmethod
    def get_events(user_id, start_date=None, end_date=None):
        """
        Get events for a user (organizer) within range
        """
        query = "SELECT id, title, description, start_time, end_time, location, candidate_id FROM calendar_events WHERE organizer_id = %s"
        params = [user_id]
        
        if start_date:
            query += " AND start_time >= %s"
            params.append(start_date)
        if end_date:
            query += " AND end_time <= %s"
            params.append(end_date)
            
        query += " ORDER BY start_time ASC"
        
        rows = Database.query(query, tuple(params), fetchall=True)
        return [
            {
                'id': r[0],
                'title': r[1],
                'description': r[2],
                'start_time': r[3].isoformat() if r[3] else None,
                'end_time': r[4].isoformat() if r[4] else None,
                'location': r[5],
                'candidate_id': r[6]
            }
            for r in rows
        ]
