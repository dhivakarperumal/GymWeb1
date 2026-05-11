-- Migration 0051: Create followups table
CREATE TABLE IF NOT EXISTS followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT,
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    gender VARCHAR(20),
    plan_name VARCHAR(255),
    plan_duration VARCHAR(100),
    plan_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    followup_date DATETIME,
    notes TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL
);
