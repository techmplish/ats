from app import create_app
from app.db import Database

app = create_app()

with app.app_context():
    print("--- USERS ---")
    users = Database.query("SELECT id, email, first_name, last_name FROM users", fetchall=True)
    for u in users:
        print(u)

    print("\n--- CANDIDATES ---")
    candidates = Database.query("SELECT id, email, first_name, last_name FROM candidates", fetchall=True)
    for c in candidates:
        print(c)

    print("\n--- JOBS ---")
    jobs = Database.query("SELECT id, title FROM job_postings", fetchall=True)
    for j in jobs:
        print(j)

    print("\n--- APPLICATIONS ---")
    apps = Database.query("SELECT id, candidate_id, job_id, status, stage FROM applications", fetchall=True)
    for a in apps:
        print(a)
