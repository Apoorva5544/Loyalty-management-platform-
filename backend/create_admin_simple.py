"""
Simple script to create an admin user
Uses a pre-hashed password to avoid bcrypt issues
"""

import sqlite3
import uuid

def create_admin():
    # Connect to the database
    conn = sqlite3.connect('loyalty.db')
    cursor = conn.cursor()
    
    # Check if admin exists
    cursor.execute("SELECT * FROM users WHERE email = ?", ("admin@loyaltyplatform.com",))
    if cursor.fetchone():
        print("Admin user already exists!")
        conn.close()
        return
    
    # Get or create a store
    cursor.execute("SELECT id FROM stores LIMIT 1")
    store = cursor.fetchone()
    
    if not store:
        store_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO stores (id, name, company_url, organization_id)
            VALUES (?, ?, ?, ?)
        """, (store_id, "Demo Store", "https://demo.com", "default-org"))
        print(f"Created store: {store_id}")
    else:
        store_id = store[0]
        print(f"Using existing store: {store_id}")
    
    # Create admin user with a simple bcrypt hash for "admin123"
    # This is a pre-computed hash for the password "admin123"
    admin_id = str(uuid.uuid4())
    password_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.xNb/4e"  # admin123
    
    cursor.execute("""
        INSERT INTO users (id, email, name, password, role, store_id, points, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (admin_id, "admin@loyaltyplatform.com", "Admin User", password_hash, "ADMIN", store_id, 0))
    
    conn.commit()
    conn.close()
    
    print("\n✅ Admin user created successfully!")
    print("Email: admin@loyaltyplatform.com")
    print("Password: admin123")
    print("\nYou can now login at http://localhost:3000/login")

if __name__ == "__main__":
    create_admin()
