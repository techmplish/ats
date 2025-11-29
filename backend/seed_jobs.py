from app import create_app
from app.services.job_service import JobService
from app.db import Database
import random

app = create_app()

jobs_data = [
    ("Senior Java Developer", "Engineering", "Bangalore", "Infosys", "Expert in Java, Spring Boot, and Microservices."),
    ("Python Data Scientist", "Analytics", "Mumbai", "TCS", "Experience with Pandas, Scikit-learn, and TensorFlow."),
    (".NET Core Architect", "Engineering", "Pune", "Wipro", "Deep knowledge of .NET Core, Azure, and C#."),
    ("SAP ABAP Consultant", "ERP", "Hyderabad", "HCL", "5+ years in SAP ABAP development and debugging."),
    ("SAS Analyst", "Analytics", "Delhi", "TCS", "Statistical analysis using SAS and SQL."),
    ("Machine Learning Engineer", "AI/ML", "Bangalore", "TechMahindra", "Building and deploying ML models at scale."),
    ("Full Stack Developer (Java)", "Engineering", "Chennai", "Infosys", "Java backend with React/Angular frontend experience."),
    ("Cloud DevOps Engineer", "Infrastructure", "Pune", "Wipro", "AWS/Azure, Docker, Kubernetes, and CI/CD pipelines."),
    ("Data Analyst", "Analytics", "Mumbai", "HCL", "Strong SQL and Tableau/PowerBI skills."),
    ("SAP FICO Consultant", "ERP", "Hyderabad", "TechMahindra", "Finance and Controlling module expertise."),
    ("Python Backend Developer", "Engineering", "Bangalore", "TCS", "Django/Flask development for high-scale apps."),
    ("AI Research Scientist", "AI/ML", "Delhi", "Infosys", "PhD in AI/ML with publication record."),
    ("Frontend Developer (React)", "Engineering", "Chennai", "Wipro", "Creating responsive UIs with React and Redux."),
    ("Big Data Engineer", "Data", "Pune", "HCL", "Hadoop, Spark, and Kafka experience."),
    ("Cyber Security Analyst", "Security", "Mumbai", "TechMahindra", "Network security, penetration testing, and compliance."),
    ("Product Manager", "Product", "Bangalore", "Infosys", "Leading product roadmap for enterprise solutions."),
    ("UX Designer", "Design", "Hyderabad", "TCS", "User research, wireframing, and prototyping."),
    ("QA Automation Engineer", "Quality", "Chennai", "Wipro", "Selenium, Appium, and Python scripting."),
    ("Blockchain Developer", "Engineering", "Delhi", "HCL", "Smart contracts, Ethereum, and Hyperledger."),
    ("HR Analytics Specialist", "HR", "Mumbai", "TechMahindra", "People analytics and workforce planning.")
]

# Mock user ID for 'created_by' (assuming user ID 1 exists, usually admin/recruiter)
# If not, we'll just use 1.
CREATED_BY_USER_ID = 1

with app.app_context():
    print("--- SEEDING JOBS ---")
    try:
        for title, dept, loc, company, desc in jobs_data:
            # We need to inject company name into description or title since we don't have a company column yet?
            # Wait, the prompt asked for "different locations and company names". 
            # Looking at JobService.create_job, it takes: title, department, location, description, requirements.
            # It DOES NOT have a company column. The 'company' is static 'Techmplish Inc.' in the frontend currently?
            # Let's check the schema or code.
            
            # Checking JobService.get_all_jobs in previous turns... 
            # It returns title, department, location... 
            # And frontend hardcodes 'Techmplish Inc.' in one place, but maybe not in job list?
            # In `frontend/app/(dashboard)/portal/jobs/page.tsx`, it shows `job.department` in a Badge.
            # It doesn't seem to show Company Name in the card?
            # Let's append Company to the Description or Title for now to satisfy the user's request visually if possible,
            # OR we can assume the user wants these properties in the DB.
            # Since I can't easily change schema right now without migration, I will append Company to Description.
            
            full_desc = f"**Company:** {company}\n\n{desc}"
            
            job_data = {
                'title': title,
                'department': dept,
                'location': loc,
                'description': full_desc,
                'requirements': "Bachelor's degree in Computer Science or related field."
            }
            
            JobService.create_job(job_data, CREATED_BY_USER_ID)
            print(f"Created: {title} at {loc} ({company})")
            
        print("--- SEEDING COMPLETE ---")
    except Exception as e:
        print(f"ERROR: {e}")
