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
    swagger = Swagger(app)
    
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

    @app.route('/health')
    def health():
        return {'status': 'healthy'}

    @app.route('/')
    def index():
        from flask import redirect
        return redirect('/apidocs')
        
    return app
