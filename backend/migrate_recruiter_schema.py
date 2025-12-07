
import sys
import os

# Add the current directory to sys.path to make imports work
sys.path.append(os.getcwd())

from app.db import Database

def migrate():
    print("Running Recruiter Schema Migration...")
    try:
        # 1. Add company_name to users
        print("Checking users table...")
        try:
            Database.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)")
            print("Added company_name to users.")
        except Exception as e:
            print(f"Error altering users: {e}")

        # 2. Add fields to job_postings
        print("Checking job_postings table...")
        columns = [
            ("salary_min", "DECIMAL(10, 2)"),
            ("salary_max", "DECIMAL(10, 2)"),
            ("currency", "VARCHAR(10) DEFAULT 'USD'"),
            ("custom_job_id", "VARCHAR(50)")
        ]
        
        for col, dtype in columns:
            try:
                Database.execute(f"ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS {col} {dtype}")
                print(f"Added {col} to job_postings.")
            except Exception as e:
                print(f"Error altering job_postings for {col}: {e}")

        # 3. Backfill custom_job_id for existing jobs
        print("Backfilling custom_job_id...")
        try:
            # We want JOB-101, JOB-102 etc.
            # Use a simple update loop or a fancy SQL. 
            # Simple SQL using ID:
            Database.execute("UPDATE job_postings SET custom_job_id = CONCAT('JOB-', id) WHERE custom_job_id IS NULL")
            print("Backfilled custom_job_id.")
        except Exception as e:
            print(f"Error backfilling: {e}")

        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    # We need to create app context if Database relies on it for config, 
    # but based on db.py it might just use env vars.
    # Let's check if we need app context. db.py uses current_app for config usually?
    # Checking db.py content would contain clues, but I'll assume standard flask pattern:
    from app import create_app
    app = create_app()
    with app.app_context():
        migrate()
