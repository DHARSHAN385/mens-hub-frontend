import MySQLdb

try:
    # Connect to MySQL server
    conn = MySQLdb.connect(
        host='localhost',
        user='root',
        passwd='1127'
    )
    cursor = conn.cursor()
    
    # Create database if it doesn't exist
    cursor.execute("CREATE DATABASE IF NOT EXISTS mens_hub_db;")
    print("Database 'mens_hub_db' created or already exists!")
    
    cursor.close()
    conn.close()
except MySQLdb.Error as e:
    print(f"Error: {e}")
