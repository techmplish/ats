import sys
import os

# Add the current directory to sys.path to make imports work
sys.path.append(os.getcwd())

from app.db import Database
from app.services.auth_service import AuthService
from app.services.job_service import JobService
from app.services.candidate_service import CandidateService

def seed():
    print("Seeding data...")
    try:
        # 1. Ensure a user exists
        try:
            user_id = AuthService.register_user("demo@techmplish.com", "password123", "Demo", "User")
            print(f"Created user with ID: {user_id}")
        except Exception:
            # User might already exist, get their ID
            res = Database.query("SELECT id FROM users WHERE email = 'demo@techmplish.com'", fetchone=True)
            user_id = res[0]
            print(f"Using existing user ID: {user_id}")

        # 2. Create a Job
        job_data = {
            "title": "Senior Python Engineer",
            "department": "Engineering",
            "location": "Remote",
            "description": "We are looking for an expert in Python and Flask.",
            "requirements": "5+ years of experience."
        }
        # Check if job exists to avoid duplicates
        res_job = Database.query("SELECT id FROM job_postings WHERE title = %s", (job_data['title'],), fetchone=True)
        if not res_job:
            JobService.create_job(job_data, user_id)
            # Get the ID
            res_job = Database.query("SELECT id FROM job_postings WHERE title = %s", (job_data['title'],), fetchone=True)
            print("Created Job: Senior Python Engineer")
        else:
            print("Job already exists")
        
        job_id = res_job[0]

        # 3. Create a Candidate
        candidate_data = {
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice.smith@example.com",
            "phone": "123-456-7890",
            "linkedin_url": "https://linkedin.com/in/alicesmith",
            "skills": "Python, Django, Flask, AWS",
            "experience_years": 6
        }
        candidate_id = CandidateService.create_candidate(candidate_data)
        print(f"Created/Found Candidate: Alice Smith (ID: {candidate_id})")

        # 4. Create an Application
        try:
            CandidateService.create_application(job_id, candidate_id)
            print("Created Application for Alice")
            
            # Get App ID
            res_app = Database.query("SELECT id FROM applications WHERE job_id = %s AND candidate_id = %s", (job_id, candidate_id), fetchone=True)
            app_id = res_app[0]
            
            # Update stage to 'Screening' to show movement
            CandidateService.update_application_stage(app_id, 'Screening')
            print("Updated Application Stage to 'Screening'")
            
            # Add a mock score
            Database.execute("UPDATE applications SET score = 85 WHERE id = %s", (app_id,))
            print("Added mock score: 85%")

        except ValueError as e:
            print(f"Application might already exist: {e}")

        print("Seeding completed successfully!")

    except Exception as e:
        print(f"Seeding failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        seed()
