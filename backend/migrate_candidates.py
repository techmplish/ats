from app.db import Database
from app import create_app

app = create_app()

def apply_migration():
    print("Applying migration...")
    try:
        # Check if columns exist, if not add them
        columns = [
            ("headline", "TEXT"),
            ("summary", "TEXT"),
            ("education", "TEXT"),
            ("experience", "TEXT"),
            ("projects", "TEXT"),
            ("languages", "TEXT")
        ]
        
        for col, dtype in columns:
            try:
                Database.execute(f"ALTER TABLE candidates ADD COLUMN {col} {dtype}")
                print(f"Added column {col}")
            except Exception as e:
                print(f"Column {col} might already exist or error: {e}")
                
        print("Migration complete.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    with app.app_context():
        apply_migration()
