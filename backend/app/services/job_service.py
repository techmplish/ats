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
    def get_all_jobs():
        rows = Database.query(
            """
            SELECT j.id, j.title, j.department, j.location, j.status, j.created_at, j.description, COUNT(a.id) as application_count
            FROM job_postings j
            LEFT JOIN applications a ON j.id = a.job_id
            GROUP BY j.id, j.title, j.department, j.location, j.status, j.created_at, j.description
            ORDER BY j.created_at DESC
            """,
            fetchall=True
        )
        return [
            {
                'id': r[0], 'title': r[1], 'department': r[2], 
                'location': r[3], 'status': r[4], 'created_at': r[5],
                'description': r[6], 'application_count': r[7]
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
