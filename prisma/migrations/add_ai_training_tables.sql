-- AI Training System Database Schema
-- Migration: Add AI Training and Fine-tuning Tables
-- Version: 1.0
-- Date: 2024-12-24

-- Create AI Training Examples Table
CREATE TABLE ai_training_examples (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    completion TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'ml',
    source TEXT NOT NULL DEFAULT 'API_SUBMISSION',
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    metadata TEXT,
    confidence REAL,
    created_by TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for ai_training_examples
CREATE INDEX idx_ai_training_examples_status ON ai_training_examples(status);
CREATE INDEX idx_ai_training_examples_language ON ai_training_examples(language);
CREATE INDEX idx_ai_training_examples_created_at ON ai_training_examples(created_at);
CREATE INDEX idx_ai_training_examples_created_by ON ai_training_examples(created_by);

-- Create AI Fine-tune Jobs Table
CREATE TABLE ai_finetune_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PREPARING',
    source_dataset_size INTEGER NOT NULL,
    dataset_filters TEXT,
    external_job_id TEXT,
    resulting_model_id TEXT,
    accuracy REAL,
    error TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ai_finetune_jobs
CREATE INDEX idx_ai_finetune_jobs_status ON ai_finetune_jobs(status);
CREATE INDEX idx_ai_finetune_jobs_created_at ON ai_finetune_jobs(created_at);
CREATE INDEX idx_ai_finetune_jobs_resulting_model_id ON ai_finetune_jobs(resulting_model_id);

-- Create App Configuration Table
CREATE TABLE app_config (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for app_config
CREATE INDEX idx_app_config_key ON app_config(key);

-- Insert default configuration
INSERT INTO app_config (id, key, value, description, is_system, created_at, updated_at) 
VALUES (
    'config_' || hex(randomblob(16)),
    'active_ai_model_id',
    'base_model',
    'Currently active AI model for production use',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_ai_training_examples_updated_at 
    AFTER UPDATE ON ai_training_examples
BEGIN
    UPDATE ai_training_examples 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER update_ai_finetune_jobs_updated_at 
    AFTER UPDATE ON ai_finetune_jobs
BEGIN
    UPDATE ai_finetune_jobs 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER update_app_config_updated_at 
    AFTER UPDATE ON app_config
BEGIN
    UPDATE app_config 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Add sample training data for testing
INSERT INTO ai_training_examples (
    id, prompt, completion, language, source, status, created_by, created_at, updated_at
) VALUES 
(
    'train_' || hex(randomblob(16)),
    'എനിക്ക് എം.ജി. റോഡിൽ നിന്ന് കൊരമംഗലയിലേക്ക് ഒരു ടാക്സി വേണം',
    '{"pickup": "MG Road", "dropoff": "Koramangala", "vehicleType": "CAR_ECONOMY", "urgency": "immediate"}',
    'ml',
    'API_SUBMISSION',
    'APPROVED',
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'train_' || hex(randomblob(16)),
    'MG Road il ninnu Koramangala-lekku oru cab venam',
    '{"pickup": "MG Road", "dropoff": "Koramangala", "vehicleType": "CAR_ECONOMY", "urgency": "immediate"}',
    'ml-en',
    'MANUAL_CORRECTION',
    'APPROVED',
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'train_' || hex(randomblob(16)),
    'I need a ride from Electronic City to Whitefield',
    '{"pickup": "Electronic City", "dropoff": "Whitefield", "vehicleType": "CAR_ECONOMY", "urgency": "immediate"}',
    'en',
    'API_SUBMISSION',
    'APPROVED',
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);