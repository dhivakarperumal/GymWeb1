-- Migration 0054: Create followup_interactions table
CREATE TABLE IF NOT EXISTS followup_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    followup_id INT NOT NULL,
    interaction_date DATETIME NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    next_followup_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (followup_id) REFERENCES followups(id) ON DELETE CASCADE
);
