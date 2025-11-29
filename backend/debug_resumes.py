from app import create_app
from app.db import Database

app = create_app()

with app.app_context():
    print("--- RESUME DATA ---")
    try:
        resumes = Database.query("SELECT candidate_id, file_path, file_name, uploaded_at FROM resumes ORDER BY uploaded_at DESC LIMIT 5", fetchall=True)
        if not resumes:
            print("No resumes found.")
        for r in resumes:
            print(f"Candidate ID: {r[0]}")
            print(f"File Path: {r[1]}")
            print(f"File Name: {r[2]}")
            print(f"Uploaded At: {r[3]}")
            print("-" * 20)
            
            # Check candidate details
            cand = Database.query("SELECT first_name, last_name, skills, experience_years FROM candidates WHERE id = %s", (r[0],), fetchone=True)
            if cand:
                print(f"Candidate: {cand[0]} {cand[1]}")
                print(f"Skills: {cand[2]}")
                print(f"Experience: {cand[3]} years")
                print("=" * 40)
    except Exception as e:
        print(f"ERROR: {e}")
