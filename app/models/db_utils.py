import sqlite3
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path
from flask import g

# Path to the database file
# This path needs to be relative and work correctly whether the script is run
# normally or as a PyInstaller bundled executable.

if getattr(sys, 'frozen', False):
    
    
    
    
    bundle_root = sys._MEIPASS
    DATABASE_NAME = os.path.join(bundle_root, 'database', 'warehouse.db')
    SCHEMA_PATH = os.path.join(bundle_root, 'database', 'schema.sql')
else:
    
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    DATABASE_NAME = os.path.abspath(os.path.join(script_dir, '..', '..', 'database', 'warehouse.db'))
    SCHEMA_PATH = os.path.abspath(os.path.join(script_dir, '..', '..', 'database', 'schema.sql'))

DB_INITIALIZED = False

def initialize_database():
    """Initializes the database by executing the schema script."""
    global DB_INITIALIZED
    if DB_INITIALIZED:
        return

    print(f"Attempting to initialize database from: {DATABASE_NAME} using schema: {SCHEMA_PATH}")
    
    # Ensure the directory for the database exists
    db_dir = os.path.dirname(DATABASE_NAME)
    if not os.path.exists(db_dir):
        try:
            os.makedirs(db_dir)
            print(f"Created database directory: {db_dir}")
        except OSError as e:
            print(f"Error creating database directory {db_dir}: {e}")
            return

    if not os.path.exists(SCHEMA_PATH):
        print(f"Error: Schema file not found at {SCHEMA_PATH}")
        return

    conn = None
    try:
        conn = sqlite3.connect(DATABASE_NAME)
        cursor = conn.cursor()
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema_script = f.read()
        cursor.executescript(schema_script)
        conn.commit()
        DB_INITIALIZED = True
        print(f"Database '{DATABASE_NAME}' initialized successfully using '{SCHEMA_PATH}'.")
    except sqlite3.Error as e:
        print(f"Database initialization error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"An unexpected error occurred during database initialization: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

def get_db():
    """Gets the database connection from the application context."""
    if 'db' not in g:
        g.db = get_db_connection()
    return g.db

def get_db_connection():
    """Establishes and returns a connection to the SQLite database."""
    global DB_INITIALIZED
    if not DB_INITIALIZED:
        initialize_database()
    
    if not os.path.exists(DATABASE_NAME):
        print(f"Error: Database file not found at {DATABASE_NAME} after initialization attempt.")
        initialize_database()
        if not os.path.exists(DATABASE_NAME):
             print(f"Critical Error: Database file still not found at {DATABASE_NAME} after re-initialization attempt.")
             return None

    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def backup_database(target_backup_path):
    """Creates a backup copy of the current SQLite database file.
    
    Args:
        target_backup_path (str): The full path (including filename) where the backup should be saved.
        
    Returns:
        tuple[bool, str]: (success_status, message_or_error_string)
    """
    # DATABASE_NAME is already defined in this module
    if not os.path.exists(DATABASE_NAME):
        return False, f"Source database {DATABASE_NAME} not found."
    
    try:
        # Ensure target directory exists
        target_dir = os.path.dirname(target_backup_path)
        if target_dir and not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            
        shutil.copy2(DATABASE_NAME, target_backup_path)
        return True, f"Database backed up successfully to {target_backup_path}"
    except Exception as e:
        print(f"Error backing up database: {e}")
        return False, str(e)

def create_timestamped_backup():
    """
    Creates a timestamped database backup in the AppData directory.
    
    Returns:
        tuple[bool, str]: (success_status, message_or_path)
    """
    try:
        app_data_dir = Path(os.getenv('APPDATA')) / 'WarehouseApp' / 'backups'
        app_data_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_filename = f'warehouse_backup_{timestamp}.db'
        target_path = app_data_dir / backup_filename
        
        return backup_database(str(target_path))
    except Exception as e:
        return False, str(e) 