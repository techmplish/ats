from app.db import Database
# Placeholder for actual RAG logic which usually involves vector DBs.
# For this strict PG requirement, we will store analysis results in PG.

class RAGService:
    @staticmethod
    def save_analysis(app_id, match_score, analysis_text, keywords, missing):
        Database.execute(
            """
            INSERT INTO analysis_results (application_id, match_score, analysis_text, keywords_matched, missing_keywords)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (app_id, match_score, analysis_text, keywords, missing)
        )

    @staticmethod
    def get_analysis(app_id):
        row = Database.query(
            """
            SELECT match_score, analysis_text, keywords_matched, missing_keywords, created_at
            FROM analysis_results
            WHERE application_id = %s
            ORDER BY created_at DESC
            """,
            (app_id,),
            fetchone=True
        )
        if not row:
            return None
        return {
            'match_score': row[0],
            'analysis_text': row[1],
            'keywords_matched': row[2],
            'missing_keywords': row[3],
            'created_at': row[4]
        }
