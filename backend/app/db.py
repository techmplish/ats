import os
import psycopg2
from psycopg2 import pool
from flask import current_app, g

class Database:
    _pool = None

    @classmethod
    def initialize(cls):
        if cls._pool is None:
            import time
            retries = 5
            while retries > 0:
                try:
                    cls._pool = psycopg2.pool.ThreadedConnectionPool(
                        minconn=1,
                        maxconn=20,
                        host=os.environ.get("DB_HOST", "db"),
                        port=os.environ.get("DB_PORT", "5432"),
                        dbname=os.environ.get("DB_NAME", "techmplish_ats"),
                        user=os.environ.get("DB_USER", "postgres"),
                        password=os.environ.get("DB_PASSWORD", "postgres_password")
                    )
                    print("Database connection pool created successfully.")
                    break
                except Exception as e:
                    print(f"Error creating connection pool: {e}. Retrying in 2 seconds...")
                    time.sleep(2)
                    retries -= 1
            
            if cls._pool is None:
                raise Exception("Could not connect to the database after multiple retries.")

    @classmethod
    def get_db(cls):
        if 'db' not in g:
            g.db = cls._pool.getconn()
        return g.db

    @classmethod
    def close_db(cls, e=None):
        db = g.pop('db', None)
        if db is not None:
            cls._pool.putconn(db)

    @staticmethod
    def query(sql, params=None, fetchone=False, fetchall=False, commit=False):
        conn = Database.get_db()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, params)
            if commit:
                conn.commit()
                return cursor.lastrowid # Note: This might not work for all INSERTs in PG without RETURNING
            
            if fetchone:
                return cursor.fetchone()
            if fetchall:
                return cursor.fetchall()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

    @staticmethod
    def execute(sql, params=None):
        """Executes a query and returns the cursor for further processing if needed, or just commits."""
        conn = Database.get_db()
        cursor = conn.cursor()
        try:
            cursor.execute(sql, params)
            conn.commit()
            return cursor
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

def init_app(app):
    Database.initialize()
    app.teardown_appcontext(Database.close_db)
