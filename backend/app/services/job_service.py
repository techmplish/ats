from app.db import Database

class JobService:
    @staticmethod
    def create_job(data, user_id):
        Database.execute(
            """
            INSERT INTO job_postings (title, department, location, description, requirements, created_by, salary_min, salary_max, currency, custom_job_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data['title'], 
                data['department'], 
                data['location'], 
                data['description'], 
                data['requirements'], 
                user_id,
                data.get('salary_min'),
                data.get('salary_max'),
                data.get('currency', 'USD'),
                data.get('custom_job_id') 
            )
        )
        
        # If custom_job_id wasn't provided, generate it based on the new ID
        if not data.get('custom_job_id'):
            # Get the ID of the job we just created (assuming title/created_by unique enough for latest, or use RETURNING if DB wrapper supported)
            # Safe way: Select max ID for this user? Or assume title unique?
            # Let's try finding by title + created_at desc
            job = Database.query(
                "SELECT id FROM job_postings WHERE title=%s AND created_by=%s ORDER BY id DESC LIMIT 1",
                (data['title'], user_id),
                fetchone=True
            )
            if job:
                job_id = job[0]
                custom_id = f"JOB-{job_id}"
                Database.execute("UPDATE job_postings SET custom_job_id = %s WHERE id = %s", (custom_id, job_id))

        return {"message": "Job created"}

    @staticmethod
    def get_all_jobs(candidate_id=None, page=1, limit=10, status=None):
        offset = (page - 1) * limit
        
        where_clause = ""
        params = [candidate_id]
        
        if status:
            if status == 'closed':
                 where_clause = "WHERE j.status != 'active'" # Treat anything not active as closed? Or specifically 'closed'? Let's stick to != 'active' based on previous logic, or exact match if schema is strict. Previous logic was j.status !== 'active'.
            else:
                 where_clause = "WHERE j.status = %s"
                 params.append(status)

        # Base query for data
        query = f"""
            SELECT j.id, j.title, j.department, j.location, j.status, j.created_at, j.description, 
                   COUNT(all_apps.id) as application_count,
                   my_app.status as application_status,
                   my_app.id as application_id,
                   j.salary_min, j.salary_max, j.currency, j.custom_job_id,
                   u.company_name
            FROM job_postings j
            LEFT JOIN users u ON j.created_by = u.id
            LEFT JOIN applications all_apps ON j.id = all_apps.job_id
            LEFT JOIN applications my_app ON j.id = my_app.job_id AND my_app.candidate_id = %s
            {where_clause}
            GROUP BY j.id, j.title, j.department, j.location, j.status, j.created_at, j.description, my_app.status, my_app.id, j.salary_min, j.salary_max, j.currency, j.custom_job_id, u.company_name
            ORDER BY j.created_at DESC
            LIMIT {limit} OFFSET {offset}
        """
        
        rows = Database.query(query, tuple(params), fetchall=True)
        
        # Query for total count
        count_param = []
        count_where = ""
        if status:
             if status == 'closed':
                 count_where = "WHERE status != 'active'"
             else:
                 count_where = "WHERE status = %s"
                 count_param.append(status)
                 
        count_query = f"SELECT COUNT(*) FROM job_postings {count_where}"
        total_rows = Database.query(count_query, tuple(count_param), fetchone=True)
        total_count = total_rows[0] if total_rows else 0
        
        jobs = [
            {
                'id': r[0], 'title': r[1], 'department': r[2], 
                'location': r[3], 'status': r[4], 'created_at': r[5].isoformat() if r[5] else None,
                'description': r[6], 'application_count': r[7],
                'application_status': r[8],
                'application_id': r[9],
                'salary_min': float(r[10]) if r[10] else None,
                'salary_max': float(r[11]) if r[11] else None,
                'currency': r[12],
                'custom_job_id': r[13],
                'company_name': r[14]
            } 
            for r in rows
        ]
        
        return {
            'jobs': jobs,
            'total': total_count,
            'page': page,
            'limit': limit
        }

    @staticmethod
    def get_job_by_id(job_id):
        row = Database.query(
            """
            SELECT j.id, j.title, j.department, j.location, j.description, j.requirements, j.status, j.created_at,
                   j.salary_min, j.salary_max, j.currency, j.custom_job_id, u.company_name
            FROM job_postings j
            LEFT JOIN users u ON j.created_by = u.id
            WHERE j.id = %s
            """,
            (job_id,),
            fetchone=True
        )
        if not row:
            return None
        return {
            'id': row[0], 'title': row[1], 'department': row[2], 
            'location': row[3], 'description': row[4], 'requirements': row[5],
            'status': row[6], 'created_at': row[7],
            'salary_min': float(row[8]) if row[8] else None,
            'salary_max': float(row[9]) if row[9] else None,
            'currency': row[10],
            'custom_job_id': row[11],
            'company_name': row[12]
        }

    @staticmethod
    def update_job(job_id, data):
        # Fetch existing job to merge
        existing = Database.query(
            "SELECT title, department, location, description, requirements, status FROM job_postings WHERE id=%s",
            (job_id,), fetchone=True
        )
        if not existing:
            raise Exception("Job not found")
            
        # Build update query dynamically or merge data
        title = data.get('title', existing[0])
        department = data.get('department', existing[1])
        location = data.get('location', existing[2])
        description = data.get('description', existing[3])
        requirements = data.get('requirements', existing[4])
        status = data.get('status', existing[5])
        
        Database.execute(
            """
            UPDATE job_postings 
            SET title=%s, department=%s, location=%s, description=%s, requirements=%s, status=%s
            WHERE id=%s
            """,
            (title, department, location, description, requirements, status, job_id)
        )

    @staticmethod
    def delete_job(job_id):
        Database.execute("DELETE FROM job_postings WHERE id = %s", (job_id,))
