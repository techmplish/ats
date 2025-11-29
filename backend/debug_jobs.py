from app import create_app
from app.services.job_service import JobService

app = create_app()

with app.app_context():
    print("--- JOBS FOR CANDIDATE 2 ---")
    try:
        jobs = JobService.get_all_jobs(candidate_id=2)
        for j in jobs:
            print(j)
    except Exception as e:
        print(f"ERROR: {e}")
