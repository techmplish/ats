# Techmplish ATS

A complete Applicant Tracking System (ATS) with AI-powered features.

## Features
- **Resume Parsing**: Automatically extracts text from PDF/DOCX.
- **RAG Q&A**: Chat with your candidate database using AI.
- **Pipeline Board**: Kanban-style job application tracking.
- **AI Analysis**: Auto-score candidates against JDs.

## Quick Start (Local)

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (running locally or via Docker)

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. Create `.env` from `.env.example`
4. `flask run`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Docker Deployment
1. `cd docker`
2. `docker-compose up --build`
