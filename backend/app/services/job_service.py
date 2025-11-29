from app.db import Database

class JobService:
    @staticmethod
    def create_job(data, user_id):
        Database.execute(
            """
            INSERT INTO job_postings (title, department, location, description, requirements, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (data['title'], data['department'], data['location'], data['description'], data['requirements'], user_id)
        )
        # Fetch the created job to return it (or just return success)
        # For simplicity in this raw SQL approach without RETURNING in execute wrapper:
        return {"message": "Job created"}

    @staticmethod
    def get_all_jobs(candidate_id=None):
        # Base query
        query = """
            SELECT j.id, j.title, j.department, j.location, j.status, j.created_at, j.description, 
                   COUNT(all_apps.id) as application_count,
                   my_app.status as application_status,
                   my_app.id as application_id
            FROM job_postings j
            LEFT JOIN applications all_apps ON j.id = all_apps.job_id
            LEFT JOIN applications my_app ON j.id = my_app.job_id AND my_app.candidate_id = %s
            GROUP BY j.id, j.title, j.department, j.location, j.status, j.created_at, j.description, my_app.status, my_app.id
            ORDER BY j.created_at DESC
        """
        
        rows = Database.query(query, (candidate_id,), fetchall=True)
        
        return [
            {
                'id': r[0], 'title': r[1], 'department': r[2], 
                'location': r[3], 'status': r[4], 'created_at': r[5].isoformat() if r[5] else None,
                'description': r[6], 'application_count': r[7],
                'application_status': r[8],
                'application_id': r[9]
            } 
            for r in rows
        ]

    @staticmethod
    def get_job_by_id(job_id):
        row = Database.query(
            """
            SELECT id, title, department, location, description, requirements, status, created_at 
            FROM job_postings 
            WHERE id = %s
            """,
            (job_id,),
            fetchone=True
        )
        if not row:
            return None
        return {
            'id': row[0], 'title': row[1], 'department': row[2], 
            'location': row[3], 'description': row[4], 'requirements': row[5],
            'status': row[6], 'created_at': row[7]
        }

    @staticmethod
    def update_job(job_id, data):
        # Dynamic update query builder could be better, but keeping it simple
        Database.execute(
            """
            UPDATE job_postings 
            SET title=%s, department=%s, location=%s, description=%s, requirements=%s, status=%s
            WHERE id=%s
            """,
            (data['title'], data['department'], data['location'], data['description'], data['requirements'], data.get('status', 'active'), job_id)
        )

    @staticmethod
    def delete_job(job_id):
        Database.execute("DELETE FROM job_postings WHERE id = %s", (job_id,))
