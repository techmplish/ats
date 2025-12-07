from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.db import init_app

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize DB
    init_app(app)

    # Initialize Swagger
    from flasgger import Swagger
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec_1',
                "route": '/apispec_1.json',
                "rule_filter": lambda rule: True,  # all in
                "model_filter": lambda tag: True,  # all in
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs/"
    }
    
    template = {
        "swagger": "2.0",
        "info": {
            "title": "Techmplish ATS API",
            "description": """
### Techmplish ATS Backend API

Welcome to the Techmplish ATS API documentation.

**Authentication:**
Most endpoints require a JWT token.
1. Login via `/auth/login` to get a token.
2. Use the token in the `Authorization` header: `Bearer <your_token>`

**Key Features:**
*   **Jobs**: Create, list, and manage job postings.
*   **Candidates**: Manage candidate profiles and resumes.
*   **Applications**: Track job applications and status.
*   **Dashboard**: Get candidate statistics.
            """,
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
            }
        },
        "security": [
            {
                "Bearer": []
            }
        ],
        "tags": [
            {"name": "Authentication", "description": "User login and registration"},
            {"name": "Jobs", "description": "Job posting management"},
            {"name": "Applications", "description": "Application tracking"},
            {"name": "Candidates", "description": "Candidate profiles"},
            {"name": "Dashboard", "description": "Statistics and metrics"},
            {"name": "AI Analysis", "description": "RAG and Resume Analysis"},
            {"name": "Files", "description": "File uploads (Resumes, JDs)"}
        ]
    }

    swagger = Swagger(app, config=swagger_config, template=template)
    
    # Register Blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.routes.jobs import jobs_bp
    app.register_blueprint(jobs_bp, url_prefix='/jobs')

    from app.routes.candidates import candidates_bp
    app.register_blueprint(candidates_bp, url_prefix='/candidates')

    from app.routes.applications import applications_bp
    app.register_blueprint(applications_bp, url_prefix='/applications')
    
    from app.routes.rag import rag_bp
    app.register_blueprint(rag_bp, url_prefix='/rag')

    from app.routes.analysis import analysis_bp
    app.register_blueprint(analysis_bp, url_prefix='/analysis')
    
    from app.routes.resume import resume_bp
    app.register_blueprint(resume_bp, url_prefix='/resume')

    from app.routes.jd import jd_bp
    app.register_blueprint(jd_bp, url_prefix='/jd')

    from app.routes.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')

    from app.routes.reports import reports_bp
    app.register_blueprint(reports_bp, url_prefix='/reports')

    from app.routes.calendar import calendar_bp
    app.register_blueprint(calendar_bp, url_prefix='/calendar')

    @app.route('/health')
    def health():
        return {'status': 'healthy'}

    @app.route('/')
    def index():
        from flask import redirect
        return redirect('/apidocs')
        
    return app
