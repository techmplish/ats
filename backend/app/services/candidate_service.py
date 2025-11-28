from app.db import Database

class CandidateService:
    @staticmethod
    def create_candidate(data):
        # Check if email exists
        existing = Database.query("SELECT id FROM candidates WHERE email = %s", (data['email'],), fetchone=True)
        if existing:
            return existing[0] # Return existing ID

        Database.execute(
            """
            INSERT INTO candidates (first_name, last_name, email, phone, linkedin_url, portfolio_url, skills, experience_years)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (data['first_name'], data['last_name'], data['email'], data.get('phone'), data.get('linkedin_url'), data.get('portfolio_url'), data.get('skills'), data.get('experience_years'))
        )
        
        # Get the ID
        row = Database.query("SELECT id FROM candidates WHERE email = %s", (data['email'],), fetchone=True)
        return row[0]

    @staticmethod
    def create_application(job_id, candidate_id):
        # Check if already applied
        existing = Database.query(
            "SELECT id FROM applications WHERE job_id = %s AND candidate_id = %s", 
            (job_id, candidate_id), 
            fetchone=True
        )
        if existing:
            raise ValueError("Candidate already applied for this job")

        Database.execute(
            "INSERT INTO applications (job_id, candidate_id, stage) VALUES (%s, %s, 'Applied')",
            (job_id, candidate_id)
        )

    @staticmethod
    def get_applications_board():
        rows = Database.query(
            """
            SELECT a.id, c.first_name, c.last_name, j.title, a.stage, a.score, a.updated_at
            FROM applications a
            JOIN candidates c ON a.candidate_id = c.id
            JOIN job_postings j ON a.job_id = j.id
            ORDER BY a.updated_at DESC
            """,
            fetchall=True
        )
        return [
            {
                'id': r[0], 
                'candidate_name': f"{r[1]} {r[2]}", 
                'job_title': r[3], 
                'stage': r[4], 
                'score': r[5],
                'updated_at': r[6]
            }
            for r in rows
        ]

    @staticmethod
    def get_application_details(app_id):
        row = Database.query(
            """
            SELECT a.id, c.first_name, c.last_name, c.email, c.phone, c.linkedin_url, 
                   j.title, a.stage, a.score, a.status, a.applied_at
            FROM applications a
            JOIN candidates c ON a.candidate_id = c.id
            JOIN job_postings j ON a.job_id = j.id
            WHERE a.id = %s
            """,
            (app_id,),
            fetchone=True
        )
        if not row:
            return None
            
        return {
            'id': row[0],
            'candidate': {
                'first_name': row[1], 'last_name': row[2], 'email': row[3], 
                'phone': row[4], 'linkedin_url': row[5]
            },
            'job_title': row[6],
            'stage': row[7],
            'score': row[8],
            'status': row[9],
            'applied_at': row[10]
        }

    @staticmethod
    def update_application_stage(app_id, stage):
        Database.execute("UPDATE applications SET stage = %s WHERE id = %s", (stage, app_id))
