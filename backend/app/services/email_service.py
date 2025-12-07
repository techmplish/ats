class EmailService:
    @staticmethod
    def send_email(to_email, subject, body):
        # In a real app, this would use SMTP or an API like SendGrid/SES
        print(f"==================================================")
        print(f"EMAIL MOCK SENT")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print(f"==================================================")

    @staticmethod
    def send_application_received_email(candidate_email, candidate_name, job_title):
        subject = f"Application Received: {job_title}"
        body = f"""
        Hi {candidate_name},

        We have received your application for the position of {job_title}. 
        Our team will review your profile and get back to you soon.

        Best regards,
        Techmplish Recruiting Team
        """
        EmailService.send_email(candidate_email, subject, body)

    @staticmethod
    def send_application_alert_email(recruiter_email, candidate_name, job_title):
        subject = f"New Application: {candidate_name} for {job_title}"
        body = f"""
        Hello Recruiter,

        A new candidate has applied for {job_title}.

        Candidate: {candidate_name}
        
        Please check the ATS dashboard for more details.
        """
        EmailService.send_email(recruiter_email, subject, body)
