-- ============================================================================
-- PMIS TÉTOUAN - CORE DATABASE SCHEMA
-- Project Management Information System
-- Prefecture of Tétouan - Division d'Équipement, Ministry of Interior, Morocco
-- 
-- Database: pmis_tetouan
-- MySQL Version: 8.0+
-- Character Set: UTF8MB4 (Supports French accents, Arabic, emojis)
-- Collation: utf8mb4_unicode_ci
-- Normalization: 3NF (Third Normal Form)
--
-- Core Tables: 8
-- Version: 1.0.0
-- Created: November 21, 2025
-- ============================================================================

-- Drop database if exists (CAUTION: This will delete all data)
-- DROP DATABASE IF EXISTS pmis_tetouan;

-- Create database with UTF8MB4 support
CREATE DATABASE IF NOT EXISTS pmis_tetouan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pmis_tetouan;

-- ============================================================================
-- TABLE 1: ROLES
-- Purpose: Define system roles (ADMIN, PROJECT_MANAGER, etc.)
-- ============================================================================
CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Role identifier (ADMIN, PROJECT_MANAGER, etc.)',
  name_fr VARCHAR(100) NOT NULL COMMENT 'French display name',
  name_en VARCHAR(100) NOT NULL COMMENT 'English display name',
  description TEXT COMMENT 'Role description and responsibilities',
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active status',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL COMMENT 'User ID who created this role',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this role',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Indexes
  INDEX idx_name (name),
  INDEX idx_is_active (is_active),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System roles with RBAC support';

-- ============================================================================
-- TABLE 2: USERS
-- Purpose: User accounts with authentication and profile information
-- ============================================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Login username',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email address',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  
  -- User profile
  first_name VARCHAR(100) NOT NULL COMMENT 'First name',
  last_name VARCHAR(100) NOT NULL COMMENT 'Last name',
  phone VARCHAR(20) NULL COMMENT 'Phone number',
  department VARCHAR(100) NULL COMMENT 'Department name',
  job_title VARCHAR(100) NULL COMMENT 'Job title',
  
  -- Role relationship
  role_id INT UNSIGNED NOT NULL COMMENT 'Foreign key to roles table',
  
  -- Preferences
  preferred_language ENUM('fr', 'en', 'ar') NOT NULL DEFAULT 'fr' COMMENT 'UI language preference',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Casablanca' COMMENT 'User timezone',
  
  -- Account security
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Account active status',
  last_login_at TIMESTAMP NULL COMMENT 'Last successful login timestamp',
  failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Failed login counter',
  locked_until TIMESTAMP NULL COMMENT 'Account lock expiration time',
  password_changed_at TIMESTAMP NULL COMMENT 'Last password change',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Force password change on next login',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL COMMENT 'User ID who created this account',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this account',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role_id (role_id),
  INDEX idx_is_active (is_active),
  INDEX idx_department (department),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_last_login (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts with authentication and RBAC';

-- ============================================================================
-- TABLE 3: PROJECTS
-- Purpose: Infrastructure projects managed by the Division d'Équipement
-- ============================================================================
CREATE TABLE projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique project code (e.g., PROJ-2025-001)',
  
  -- Project information
  name_fr VARCHAR(255) NOT NULL COMMENT 'Project name in French',
  name_en VARCHAR(255) NULL COMMENT 'Project name in English',
  description TEXT NULL COMMENT 'Detailed project description',
  objectives TEXT NULL COMMENT 'Project objectives and goals',
  location VARCHAR(255) NULL COMMENT 'Project location/site',
  
  -- Project classification
  phase ENUM('Planning', 'Execution', 'Monitoring', 'Closure') 
    NOT NULL DEFAULT 'Planning' COMMENT 'Current project phase',
  status ENUM('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled') 
    NOT NULL DEFAULT 'Planning' COMMENT 'Project status',
  priority ENUM('Low', 'Medium', 'High', 'Critical') 
    NOT NULL DEFAULT 'Medium' COMMENT 'Project priority level',
  health_status ENUM('Green', 'Yellow', 'Red') 
    NOT NULL DEFAULT 'Green' COMMENT 'Overall project health',
  
  -- Timeline
  start_date DATE NOT NULL COMMENT 'Project start date',
  planned_end_date DATE NOT NULL COMMENT 'Planned completion date',
  actual_end_date DATE NULL COMMENT 'Actual completion date',
  
  -- Budget
  estimated_budget DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total estimated budget in MAD',
  
  -- Progress tracking
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 
    COMMENT 'Overall completion percentage (0.00 to 100.00)',
  
  -- Relationships
  project_manager_id INT UNSIGNED NULL COMMENT 'Assigned project manager',
  
  -- Flags
  archived BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Archived project flag',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User ID who created this project',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this project',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_projects_manager FOREIGN KEY (project_manager_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_projects_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_completion_percentage 
    CHECK (completion_percentage >= 0.00 AND completion_percentage <= 100.00),
  CONSTRAINT chk_dates 
    CHECK (actual_end_date IS NULL OR actual_end_date >= start_date),
  CONSTRAINT chk_planned_dates 
    CHECK (planned_end_date >= start_date),
  
  -- Indexes
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_phase (phase),
  INDEX idx_priority (priority),
  INDEX idx_health_status (health_status),
  INDEX idx_project_manager (project_manager_id),
  INDEX idx_dates (start_date, planned_end_date),
  INDEX idx_archived (archived),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Infrastructure projects managed by Division d''Équipement';

-- ============================================================================
-- TABLE 4: MILESTONES
-- Purpose: Project milestones and deliverables tracking
-- ============================================================================
CREATE TABLE milestones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL COMMENT 'Parent project',
  
  -- Milestone information
  name_fr VARCHAR(255) NOT NULL COMMENT 'Milestone name in French',
  name_en VARCHAR(255) NULL COMMENT 'Milestone name in English',
  description TEXT NULL COMMENT 'Milestone description',
  
  -- Timeline
  target_date DATE NOT NULL COMMENT 'Target completion date',
  actual_date DATE NULL COMMENT 'Actual completion date',
  
  -- Status tracking
  status ENUM('Not Started', 'In Progress', 'Completed', 'Delayed') 
    NOT NULL DEFAULT 'Not Started' COMMENT 'Milestone status',
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 
    COMMENT 'Milestone completion (0.00 to 100.00)',
  
  -- Assignment
  responsible_user_id INT UNSIGNED NULL COMMENT 'User responsible for milestone',
  
  -- Dependencies
  depends_on_milestone_id INT UNSIGNED NULL COMMENT 'Prerequisite milestone',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User ID who created this milestone',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this milestone',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_responsible FOREIGN KEY (responsible_user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_dependency FOREIGN KEY (depends_on_milestone_id) 
    REFERENCES milestones(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_milestone_completion 
    CHECK (completion_percentage >= 0.00 AND completion_percentage <= 100.00),
  CONSTRAINT chk_milestone_dates 
    CHECK (actual_date IS NULL OR actual_date <= CURRENT_DATE),
  
  -- Indexes
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_target_date (target_date),
  INDEX idx_responsible_user (responsible_user_id),
  INDEX idx_dependency (depends_on_milestone_id),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project milestones and key deliverables';

-- ============================================================================
-- TABLE 5: BUDGETS
-- Purpose: Project budget allocations and spending tracking
-- ============================================================================
CREATE TABLE budgets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL COMMENT 'Project this budget belongs to',
  
  -- Budget details
  fiscal_year YEAR NOT NULL COMMENT 'Fiscal year (e.g., 2025)',
  category ENUM('Personnel', 'Equipment', 'Materials', 'Contractors', 'Other') 
    NOT NULL COMMENT 'Budget category',
  
  -- Amounts (in Moroccan Dirham - MAD)
  allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 
    COMMENT 'Total allocated budget in MAD',
  actual_spending DECIMAL(15,2) NOT NULL DEFAULT 0.00 
    COMMENT 'Actual spending to date in MAD',
  committed_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 
    COMMENT 'Committed but not yet spent in MAD',
  
  -- Status tracking
  status ENUM('On Track', 'At Risk', 'Exceeded') 
    NOT NULL DEFAULT 'On Track' COMMENT 'Budget status',
  
  -- Alert thresholds (triggered alerts)
  alert_threshold_50 BOOLEAN NOT NULL DEFAULT FALSE COMMENT '50% utilization alert triggered',
  alert_threshold_75 BOOLEAN NOT NULL DEFAULT FALSE COMMENT '75% utilization alert triggered',
  alert_threshold_90 BOOLEAN NOT NULL DEFAULT FALSE COMMENT '90% utilization alert triggered',
  
  -- Additional information
  notes TEXT NULL COMMENT 'Budget notes and justifications',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User ID who created this budget',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this budget',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_budgets_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_budgets_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_budgets_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Unique constraint: One budget per project/category/fiscal year
  UNIQUE KEY uk_budget (project_id, category, fiscal_year),
  
  -- Constraints
  CONSTRAINT chk_allocated_amount CHECK (allocated_amount >= 0),
  CONSTRAINT chk_actual_spending CHECK (actual_spending >= 0),
  CONSTRAINT chk_committed_amount CHECK (committed_amount >= 0),
  
  -- Indexes
  INDEX idx_project_id (project_id),
  INDEX idx_fiscal_year (fiscal_year),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project budget allocations and spending tracking';

-- ============================================================================
-- TABLE 6: EQUIPMENT
-- Purpose: Equipment inventory (vehicles, machinery, tools, etc.)
-- ============================================================================
CREATE TABLE equipment (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique equipment code (e.g., VEH-2025-001)',
  
  -- Equipment information
  name VARCHAR(255) NOT NULL COMMENT 'Equipment name',
  category ENUM('Vehicles', 'Machinery', 'Tools', 'Electronics', 'Furniture', 'Other') 
    NOT NULL COMMENT 'Equipment category',
  serial_number VARCHAR(100) NULL COMMENT 'Manufacturer serial number',
  
  -- Acquisition details
  purchase_date DATE NULL COMMENT 'Date of purchase',
  purchase_value DECIMAL(15,2) NULL DEFAULT 0.00 COMMENT 'Purchase price in MAD',
  salvage_value DECIMAL(15,2) NULL DEFAULT 0.00 COMMENT 'Expected salvage value in MAD',
  useful_life_years INT UNSIGNED NULL DEFAULT 10 COMMENT 'Expected useful life in years',
  current_book_value DECIMAL(15,2) NULL DEFAULT 0.00 
    COMMENT 'Current depreciated book value in MAD',
  
  -- Status
  status ENUM('Available', 'In Use', 'Maintenance', 'Retired') 
    NOT NULL DEFAULT 'Available' COMMENT 'Equipment availability status',
  condition_status ENUM('Excellent', 'Good', 'Fair', 'Poor') 
    NOT NULL DEFAULT 'Good' COMMENT 'Physical condition',
  
  -- Location and usage
  location VARCHAR(255) NULL COMMENT 'Current physical location',
  usage_hours DECIMAL(10,2) NULL DEFAULT 0.00 COMMENT 'Total usage hours',
  usage_kilometers DECIMAL(10,2) NULL DEFAULT 0.00 COMMENT 'Total usage kilometers',
  
  -- Documentation
  photo_url VARCHAR(500) NULL COMMENT 'URL to equipment photo',
  barcode VARCHAR(100) NULL COMMENT 'Barcode for tracking',
  notes TEXT NULL COMMENT 'Additional notes',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User ID who created this record',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this record',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_equipment_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_purchase_value CHECK (purchase_value IS NULL OR purchase_value >= 0),
  CONSTRAINT chk_salvage_value CHECK (salvage_value IS NULL OR salvage_value >= 0),
  CONSTRAINT chk_useful_life CHECK (useful_life_years IS NULL OR useful_life_years > 0),
  CONSTRAINT chk_usage_hours CHECK (usage_hours IS NULL OR usage_hours >= 0),
  CONSTRAINT chk_usage_kilometers CHECK (usage_kilometers IS NULL OR usage_kilometers >= 0),
  
  -- Indexes
  INDEX idx_code (code),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_condition_status (condition_status),
  INDEX idx_location (location),
  INDEX idx_barcode (barcode),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Equipment inventory and asset management';

-- ============================================================================
-- TABLE 7: VENDORS
-- Purpose: Vendor/supplier management for procurement
-- ============================================================================
CREATE TABLE vendors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique vendor code (e.g., VEN-001)',
  
  -- Vendor information
  name VARCHAR(255) NOT NULL COMMENT 'Vendor/company name',
  contact_person VARCHAR(255) NULL COMMENT 'Primary contact person',
  email VARCHAR(100) NULL COMMENT 'Email address',
  phone VARCHAR(20) NULL COMMENT 'Phone number',
  mobile VARCHAR(20) NULL COMMENT 'Mobile number',
  fax VARCHAR(20) NULL COMMENT 'Fax number',
  website VARCHAR(255) NULL COMMENT 'Company website',
  
  -- Address
  address_line1 VARCHAR(255) NULL COMMENT 'Street address line 1',
  address_line2 VARCHAR(255) NULL COMMENT 'Street address line 2',
  city VARCHAR(100) NULL COMMENT 'City',
  postal_code VARCHAR(20) NULL COMMENT 'Postal/ZIP code',
  country VARCHAR(100) NOT NULL DEFAULT 'Morocco' COMMENT 'Country',
  
  -- Business details
  tax_id VARCHAR(50) NULL COMMENT 'Tax identification number',
  commercial_register VARCHAR(50) NULL COMMENT 'Commercial registration number',
  payment_terms VARCHAR(100) NULL COMMENT 'Default payment terms (e.g., Net 30)',
  
  -- Performance tracking
  rating DECIMAL(3,2) NULL DEFAULT 0.00 COMMENT 'Vendor performance rating (0.00 to 5.00)',
  total_orders INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total number of orders',
  total_value DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total order value in MAD',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active vendor status',
  is_approved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Approved for procurement',
  
  -- Additional information
  notes TEXT NULL COMMENT 'Additional notes about vendor',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User ID who created this vendor',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this vendor',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_vendors_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_vendors_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_rating CHECK (rating IS NULL OR (rating >= 0.00 AND rating <= 5.00)),
  CONSTRAINT chk_total_orders CHECK (total_orders >= 0),
  CONSTRAINT chk_total_value CHECK (total_value >= 0),
  
  -- Indexes
  INDEX idx_code (code),
  INDEX idx_name (name),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active),
  INDEX idx_is_approved (is_approved),
  INDEX idx_city (city),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Vendor and supplier management';

-- ============================================================================
-- TABLE 8: APPROVALS
-- Purpose: Multi-level approval workflow tracking
-- ============================================================================
CREATE TABLE approvals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  
  -- Request information
  entity_type ENUM('Budget', 'Purchase', 'Project', 'Amendment', 'Other') 
    NOT NULL COMMENT 'Type of entity requiring approval',
  entity_id INT UNSIGNED NOT NULL COMMENT 'ID of the entity (project_id, budget_id, etc.)',
  request_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique approval request number',
  
  -- Requester information
  requested_by INT UNSIGNED NOT NULL COMMENT 'User who initiated the request',
  request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Request submission date',
  
  -- Request details
  request_title VARCHAR(255) NOT NULL COMMENT 'Brief title of the request',
  request_description TEXT NULL COMMENT 'Detailed description',
  request_amount DECIMAL(15,2) NULL DEFAULT 0.00 COMMENT 'Amount if financial approval (MAD)',
  
  -- Approval workflow
  approval_level INT UNSIGNED NOT NULL DEFAULT 1 
    COMMENT 'Current approval level (1, 2, 3, etc.)',
  max_approval_level INT UNSIGNED NOT NULL DEFAULT 1 
    COMMENT 'Total levels required for full approval',
  
  -- Current status
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'On Hold') 
    NOT NULL DEFAULT 'Pending' COMMENT 'Overall approval status',
  
  -- Approver information
  current_approver_id INT UNSIGNED NULL COMMENT 'User who needs to approve at current level',
  approved_by INT UNSIGNED NULL COMMENT 'User who gave final approval',
  approved_at TIMESTAMP NULL COMMENT 'Final approval timestamp',
  rejected_by INT UNSIGNED NULL COMMENT 'User who rejected',
  rejected_at TIMESTAMP NULL COMMENT 'Rejection timestamp',
  rejection_reason TEXT NULL COMMENT 'Reason for rejection',
  
  -- Priority and urgency
  priority ENUM('Low', 'Medium', 'High', 'Critical') 
    NOT NULL DEFAULT 'Medium' COMMENT 'Request priority',
  due_date DATE NULL COMMENT 'Expected decision date',
  
  -- Notifications
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Notification sent to approver',
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Reminder notification sent',
  
  -- Additional information
  attachments_url TEXT NULL COMMENT 'URLs to supporting documents',
  notes TEXT NULL COMMENT 'Additional notes',
  
  -- Audit columns
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User ID who created this request',
  updated_by INT UNSIGNED NULL COMMENT 'User ID who last updated this request',
  deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_approvals_requested_by FOREIGN KEY (requested_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_current_approver FOREIGN KEY (current_approver_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_approved_by FOREIGN KEY (approved_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_rejected_by FOREIGN KEY (rejected_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_approval_level CHECK (approval_level > 0 AND approval_level <= max_approval_level),
  CONSTRAINT chk_max_approval_level CHECK (max_approval_level > 0),
  CONSTRAINT chk_request_amount CHECK (request_amount IS NULL OR request_amount >= 0),
  
  -- Indexes
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_request_number (request_number),
  INDEX idx_requested_by (requested_by),
  INDEX idx_status (status),
  INDEX idx_current_approver (current_approver_id),
  INDEX idx_priority (priority),
  INDEX idx_due_date (due_date),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Multi-level approval workflow tracking';

-- ============================================================================
-- SEED DATA: SYSTEM ROLES
-- Insert 6 predefined system roles
-- ============================================================================
INSERT INTO roles (name, name_fr, name_en, description, is_active) VALUES
('ADMIN', 
 'Administrateur Système', 
 'System Administrator', 
 'Full system access with all permissions. Can manage users, configure settings, and access all modules.',
 TRUE),

('PROJECT_MANAGER', 
 'Chef de Projet', 
 'Project Manager', 
 'Manage projects, assign resources, track progress, manage budgets, and generate reports.',
 TRUE),

('EQUIPMENT_OFFICER', 
 'Agent Matériel', 
 'Equipment Officer', 
 'Manage equipment inventory, track allocations, record maintenance activities, and manage procurement.',
 TRUE),

('FINANCE_CONTROLLER', 
 'Contrôleur Financier', 
 'Finance Controller', 
 'Review and approve budgets, track spending, approve procurement requests, and generate financial reports.',
 TRUE),

('SUPERVISOR', 
 'Superviseur', 
 'Supervisor', 
 'View project status, generate reports, monitor budgets, and export data for ministry reporting.',
 TRUE),

('VIEWER', 
 'Lecteur', 
 'Viewer', 
 'Read-only access to assigned projects and reports. Limited to viewing information only.',
 TRUE);

-- ============================================================================
-- SEED DATA: DEFAULT ADMIN USER
-- Username: admin
-- Password: Admin@2025
-- IMPORTANT: Change this password immediately after first login!
-- ============================================================================
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role_id, 
  preferred_language,
  department,
  is_active,
  must_change_password
) VALUES (
  'admin',
  'admin@prefecture-tetouan.ma',
  '$2b$10$K8X1p/a0dL3.hsVjyf1p38OeAo3ksIfhGeLQQfLpDxGbWPGXLEgI6K',
  'System',
  'Administrator',
  1,
  'fr',
  'IT - Division d''Équipement',
  TRUE,
  TRUE
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- SHOW TABLES;
-- DESCRIBE users;
-- SELECT * FROM roles;
-- SELECT id, username, email, first_name, last_name FROM users;

-- ============================================================================
-- SCRIPT COMPLETE
-- Database: pmis_tetouan
-- Tables Created: 8
-- Roles Inserted: 6
-- Default Admin: admin / Admin@2025 (CHANGE IMMEDIATELY!)
-- ============================================================================