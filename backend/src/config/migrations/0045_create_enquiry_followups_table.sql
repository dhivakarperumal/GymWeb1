CREATE TABLE IF NOT EXISTS enquiry_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT NOT NULL,
    followup_date DATETIME NOT NULL,
    notes TEXT,
    status ENUM('pending', 'followup', 'completed', 'cancelled') DEFAULT 'pending',
    next_followup_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
);
