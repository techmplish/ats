from app.db import Database

class ReportService:
    @staticmethod
    def get_pipeline_summary(filters=None):
        """
        Returns count of applications in each stage, with optional filtering
        """
        query = """
            SELECT a.stage, COUNT(a.id) as count 
            FROM applications a
            JOIN job_postings j ON a.job_id = j.id
            JOIN users u ON j.created_by = u.id
            WHERE 1=1
        """
        params = []
        
        if filters:
            if filters.get('job_id'):
                query += " AND j.id = %s"
                params.append(filters['job_id'])
            if filters.get('location'):
                query += " AND j.location ILIKE %s"
                params.append(f"%{filters['location']}%")
            if filters.get('department'):
                query += " AND j.department ILIKE %s"
                params.append(f"%{filters['department']}%")
            if filters.get('coy_name'):
                 # Assuming company_name is on users table
                query += " AND u.company_name ILIKE %s"
                params.append(f"%{filters['coy_name']}%")

        query += " GROUP BY a.stage"
        
        rows = Database.query(query, tuple(params), fetchall=True)
        return {row[0]: row[1] for row in rows}

    @staticmethod
    def get_job_stats():
        """
        Returns job statistics: active jobs, total applications, etc.
        """
        active_jobs = Database.query("SELECT COUNT(*) FROM job_postings WHERE status = 'active'", fetchone=True)[0]
        total_apps = Database.query("SELECT COUNT(*) FROM applications", fetchone=True)[0]
        
        # Applications per job role (top 5)
        top_jobs = Database.query(
            """
            SELECT j.title, COUNT(a.id) as app_count 
            FROM job_postings j 
            LEFT JOIN applications a ON j.id = a.job_id 
            GROUP BY j.id, j.title
            ORDER BY app_count DESC 
            LIMIT 5
            """,
            fetchall=True
        )
        
        return {
            "active_jobs": active_jobs,
            "total_applications": total_apps,
            "top_jobs": [{"title": r[0], "count": r[1]} for r in top_jobs]
        }
