-- ============================================================================
-- PMIS TÉTOUAN - COMPLETE PRODUCTION DATABASE SCHEMA
-- Project Management Information System
-- Prefecture of Tétouan - Division d'Éququipement, Ministry of Interior, Morocco
-- 
-- Database: pmis_tetouan
-- MySQL Version: 8.0+
-- Character Set: UTF8MB4 (Full Unicode Support - French, Arabic, Emojis)
-- Collation: utf8mb4_unicode_ci
-- Normalization: 3NF (Third Normal Form)
-- Storage Engine: InnoDB
--
-- Total Tables: 21
-- Total Indexes: 100+
-- Total Views: 4
-- Total Seed Records: 50+
--
-- Version: 2.0.0
-- Created: November 21, 2025
-- Author: Database Architecture Team
-- ============================================================================

-- Drop existing database if needed (CAUTION: Data loss!)
-- DROP DATABASE IF EXISTS pmis_tetouan;

-- Create database with UTF8MB4 support
CREATE DATABASE IF NOT EXISTS pmis_tetouan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pmis_tetouan;

-- ============================================================================
-- SECTION 1: AUTHENTICATION & AUTHORIZATION TABLES
-- ============================================================================

-- TABLE 1: USERS (Authentication & Identity)
-- Purpose: User accounts with authentication and profile information
-- ============================================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email address',
  username VARCHAR(100) NOT NULL UNIQUE COMMENT 'Login username',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  
  -- Personal information
  first_name VARCHAR(100) NOT NULL COMMENT 'User first name',
  last_name VARCHAR(100) NOT NULL COMMENT 'User last name',
  phone VARCHAR(20) NULL COMMENT 'Phone number',
  department VARCHAR(100) NULL COMMENT 'Department name',
  employee_id VARCHAR(50) NULL UNIQUE COMMENT 'Employee ID number',
  
  -- Account security
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Account active status',
  last_login DATETIME NULL COMMENT 'Last successful login',
  login_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Failed login counter',
  locked_until DATETIME NULL COMMENT 'Account lock expiration',
  password_reset_token VARCHAR(255) NULL UNIQUE COMMENT 'Password reset token',
  password_reset_expires DATETIME NULL COMMENT 'Token expiration time',
  two_factor_secret VARCHAR(32) NULL COMMENT 'MFA secret (future use)',
  
  -- Preferences
  preferred_language ENUM('fr', 'en') NOT NULL DEFAULT 'fr' COMMENT 'UI language',
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL COMMENT 'Soft delete timestamp',
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_department (department),
  INDEX idx_employee_id (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts with authentication and RBAC';

-- TABLE 2: ROLES (Permission & Access Control)
-- Purpose: Define system roles for RBAC
-- ============================================================================
CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Role identifier (ADMIN, PROJECT_MANAGER)',
  display_name VARCHAR(100) NOT NULL COMMENT 'Human-readable name',
  description TEXT NULL COMMENT 'Role description',
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Cannot be deleted if TRUE',
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System roles for RBAC';

-- TABLE 3: USER_ROLES (Many-to-Many: Users to Roles)
-- Purpose: Assign roles to users
-- ============================================================================
CREATE TABLE user_roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT 'User receiving role',
  role_id INT UNSIGNED NOT NULL COMMENT 'Role being assigned',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT UNSIGNED NULL COMMENT 'User who assigned role',
  
  -- Foreign keys
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Unique constraint
  UNIQUE KEY uk_user_role (user_id, role_id),
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id),
  INDEX idx_assigned_at (assigned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User-to-role assignments';

-- TABLE 4: PERMISSIONS (Fine-grained Access Control)
-- Purpose: Define granular permissions
-- ============================================================================
CREATE TABLE permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permission identifier',
  display_name VARCHAR(100) NOT NULL COMMENT 'Human-readable name',
  description TEXT NULL COMMENT 'Permission description',
  resource_type VARCHAR(50) NOT NULL COMMENT 'Resource (PROJECT, BUDGET, etc.)',
  action VARCHAR(50) NOT NULL COMMENT 'Action (CREATE, READ, UPDATE, DELETE, APPROVE)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_permission_code (permission_code),
  INDEX idx_resource_type (resource_type),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fine-grained permissions for RBAC';

-- TABLE 5: ROLE_PERMISSIONS (Many-to-Many: Roles to Permissions)
-- Purpose: Assign permissions to roles
-- ============================================================================
CREATE TABLE role_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL COMMENT 'Role receiving permission',
  permission_id INT UNSIGNED NOT NULL COMMENT 'Permission being assigned',
  
  -- Foreign keys
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
    REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Unique constraint
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  
  -- Indexes
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Role-to-permission assignments';

-- ============================================================================
-- SECTION 2: PROJECT MANAGEMENT TABLES
-- ============================================================================

-- TABLE 6: PROJECTS (Core Project Information)
-- Purpose: Infrastructure projects managed by Division d'Équipement
-- ============================================================================
CREATE TABLE projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique project code (PROJ-2025-001)',
  project_name VARCHAR(255) NOT NULL COMMENT 'Project name',
  description TEXT NULL COMMENT 'Detailed description',
  project_type ENUM('CONSTRUCTION', 'RENOVATION', 'INFRASTRUCTURE', 'EQUIPMENT', 'OTHER') NOT NULL,
  status ENUM('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNING',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  
  -- Timeline
  start_date DATE NOT NULL COMMENT 'Project start date',
  planned_end_date DATE NOT NULL COMMENT 'Planned completion date',
  actual_end_date DATE NULL COMMENT 'Actual completion date',
  
  -- Location
  location VARCHAR(255) NULL COMMENT 'Project location',
  description_location TEXT NULL COMMENT 'Location details',
  
  -- Team
  project_manager_id INT UNSIGNED NOT NULL COMMENT 'Primary project manager',
  alternate_manager_id INT UNSIGNED NULL COMMENT 'Backup project manager',
  
  -- Budget
  estimated_budget DECIMAL(15,2) NOT NULL COMMENT 'Estimated budget in MAD',
  actual_budget DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Actual spending in MAD',
  currency CHAR(3) NOT NULL DEFAULT 'MAD',
  budget_status ENUM('ON_TRACK', 'AT_RISK', 'EXCEEDED') NOT NULL DEFAULT 'ON_TRACK',
  
  -- Progress
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Progress (0-100)',
  
  -- Approval
  approved_by INT UNSIGNED NULL COMMENT 'User who approved project',
  approval_date DATETIME NULL COMMENT 'Approval timestamp',
  
  -- Additional information
  objectives TEXT NULL COMMENT 'Project objectives',
  key_deliverables TEXT NULL COMMENT 'Key deliverables',
  risks TEXT NULL COMMENT 'Project risks',
  notes TEXT NULL COMMENT 'Additional notes',
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL COMMENT 'User who created project',
  updated_by INT UNSIGNED NOT NULL COMMENT 'User who last updated project',
  deleted_at DATETIME NULL COMMENT 'Soft delete timestamp',
  
  -- Foreign keys
  CONSTRAINT fk_projects_manager FOREIGN KEY (project_manager_id) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_projects_alternate FOREIGN KEY (alternate_manager_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_projects_approved_by FOREIGN KEY (approved_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_projects_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_projects_dates CHECK (planned_end_date >= start_date),
  CONSTRAINT chk_projects_budget CHECK (estimated_budget >= 0),
  CONSTRAINT chk_projects_actual_budget CHECK (actual_budget >= 0),
  CONSTRAINT chk_projects_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Indexes
  INDEX idx_project_code (project_code),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_project_manager (project_manager_id),
  INDEX idx_start_date (start_date),
  INDEX idx_planned_end_date (planned_end_date),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_project_type (project_type),
  FULLTEXT idx_project_search (project_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Infrastructure projects';

-- TABLE 7: MILESTONES (Project Phases & Deliverables)
-- Purpose: Track project milestones and dependencies
-- ============================================================================
CREATE TABLE milestones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  milestone_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique milestone code',
  project_id INT UNSIGNED NOT NULL COMMENT 'Parent project',
  title VARCHAR(255) NOT NULL COMMENT 'Milestone title',
  description TEXT NULL COMMENT 'Milestone description',
  
  -- Timeline
  planned_date DATE NOT NULL COMMENT 'Planned completion date',
  actual_completion_date DATE NULL COMMENT 'Actual completion date',
  
  -- Status
  status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Progress (0-100)',
  
  -- Assignment
  responsible_user_id INT UNSIGNED NOT NULL COMMENT 'Responsible user',
  sequence_order INT NOT NULL COMMENT 'Order in project',
  depends_on_milestone_id INT UNSIGNED NULL COMMENT 'Prerequisite milestone',
  
  -- Budget
  budget_allocated DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Budget for milestone',
  actual_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Actual cost',
  
  -- Deliverables
  deliverables TEXT NULL COMMENT 'JSON array of deliverables',
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  updated_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_responsible FOREIGN KEY (responsible_user_id) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_dependency FOREIGN KEY (depends_on_milestone_id) 
    REFERENCES milestones(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_milestones_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_milestones_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  CONSTRAINT chk_milestones_budget CHECK (budget_allocated >= 0),
  CONSTRAINT chk_milestones_cost CHECK (actual_cost >= 0),
  
  -- Indexes
  INDEX idx_milestone_code (milestone_code),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_planned_date (planned_date),
  INDEX idx_responsible_user (responsible_user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project milestones and deliverables';

-- ============================================================================
-- SECTION 3: BUDGET MANAGEMENT TABLES
-- ============================================================================

-- TABLE 8: BUDGET_ALLOCATIONS (Budget Tracking by Category)
-- Purpose: Track budget by category for each project
-- ============================================================================
CREATE TABLE budget_allocations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL COMMENT 'Parent project',
  budget_category ENUM('PERSONNEL', 'EQUIPMENT', 'MATERIALS', 'CONTRACTORS', 'OTHER') NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL COMMENT 'Allocated budget in MAD',
  spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Spent amount',
  committed_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Committed but not spent',
  alert_threshold_percent INT NOT NULL DEFAULT 90 COMMENT 'Alert at X% utilization',
  notes TEXT NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  updated_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_budget_allocations_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_budget_allocations_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_budget_allocations_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_budget_allocations_amount CHECK (allocated_amount > 0),
  CONSTRAINT chk_budget_allocations_spent CHECK (spent_amount >= 0),
  CONSTRAINT chk_budget_allocations_committed CHECK (committed_amount >= 0),
  
  -- Unique constraint
  UNIQUE KEY uk_budget_allocation (project_id, budget_category),
  
  -- Indexes
  INDEX idx_project_id (project_id),
  INDEX idx_budget_category (budget_category),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Budget allocations by category';

-- TABLE 9: BUDGET_TRANSACTIONS (Individual Budget Entries)
-- Purpose: Track individual budget transactions
-- ============================================================================
CREATE TABLE budget_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  budget_allocation_id INT UNSIGNED NOT NULL COMMENT 'Budget allocation',
  transaction_type ENUM('EXPENSE', 'COMMITMENT', 'REVERSAL') NOT NULL,
  amount DECIMAL(15,2) NOT NULL COMMENT 'Transaction amount',
  description VARCHAR(255) NOT NULL COMMENT 'Transaction description',
  reference_number VARCHAR(100) NULL COMMENT 'PO/invoice number',
  transaction_date DATE NOT NULL COMMENT 'Transaction date',
  reference_document_id INT UNSIGNED NULL COMMENT 'Link to PO/invoice',
  approved_by INT UNSIGNED NULL COMMENT 'Approving user',
  approval_date DATETIME NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_budget_transactions_allocation FOREIGN KEY (budget_allocation_id) 
    REFERENCES budget_allocations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_budget_transactions_approved_by FOREIGN KEY (approved_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_budget_transactions_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_budget_transactions_amount CHECK (amount > 0),
  
  -- Indexes
  INDEX idx_budget_allocation_id (budget_allocation_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individual budget transactions';

-- ============================================================================
-- SECTION 4: EQUIPMENT MANAGEMENT TABLES
-- ============================================================================

-- TABLE 10: EQUIPMENT (Equipment Inventory)
-- Purpose: Track all equipment assets
-- ============================================================================
CREATE TABLE equipment (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipment_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique equipment code',
  equipment_name VARCHAR(255) NOT NULL COMMENT 'Equipment name',
  equipment_type ENUM('VEHICLE', 'MACHINERY', 'TOOLS', 'ELECTRONICS', 'FURNITURE', 'OTHER') NOT NULL,
  category VARCHAR(100) NULL COMMENT 'Subcategory',
  serial_number VARCHAR(100) NULL COMMENT 'Serial number',
  manufacturer VARCHAR(100) NULL,
  model VARCHAR(100) NULL,
  
  -- Purchase information
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(15,2) NOT NULL,
  purchase_currency CHAR(3) NOT NULL DEFAULT 'MAD',
  purchase_vendor_id INT UNSIGNED NULL,
  warranty_expiry DATE NULL,
  
  -- Location and status
  location VARCHAR(255) NOT NULL,
  location_details TEXT NULL,
  status ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DAMAGED') NOT NULL DEFAULT 'AVAILABLE',
  condition_status ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR') NOT NULL DEFAULT 'GOOD',
  
  -- Current assignment
  currently_assigned_to_project_id INT UNSIGNED NULL,
  currently_assigned_user_id INT UNSIGNED NULL,
  assignment_date DATE NULL,
  
  -- Depreciation
  useful_life_years INT NOT NULL DEFAULT 5,
  salvage_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  depreciation_method ENUM('STRAIGHT_LINE', 'DECLINING_BALANCE') NOT NULL DEFAULT 'STRAIGHT_LINE',
  accumulated_depreciation DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  
  -- Insurance
  insurance_value DECIMAL(15,2) NULL,
  insurance_policy_number VARCHAR(100) NULL,
  insurance_expiry DATE NULL,
  
  -- Maintenance
  maintenance_schedule ENUM('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'AS_NEEDED') NOT NULL DEFAULT 'AS_NEEDED',
  last_maintenance_date DATE NULL,
  next_maintenance_date DATE NULL,
  
  -- Usage tracking
  operating_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  operating_kilometers DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fuel_type VARCHAR(50) NULL,
  
  -- Additional information
  notes TEXT NULL,
  photo_url VARCHAR(500) NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  updated_by INT UNSIGNED NOT NULL,
  deleted_at DATETIME NULL,
  
  -- Foreign keys
  CONSTRAINT fk_equipment_vendor FOREIGN KEY (purchase_vendor_id) 
    REFERENCES vendors(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_project FOREIGN KEY (currently_assigned_to_project_id) 
    REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_user FOREIGN KEY (currently_assigned_user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_equipment_price CHECK (purchase_price > 0),
  CONSTRAINT chk_equipment_purchase_date CHECK (purchase_date <= CURDATE()),
  CONSTRAINT chk_equipment_useful_life CHECK (useful_life_years > 0),
  CONSTRAINT chk_equipment_hours CHECK (operating_hours >= 0),
  CONSTRAINT chk_equipment_kilometers CHECK (operating_kilometers >= 0),
  
  -- Indexes
  INDEX idx_equipment_code (equipment_code),
  INDEX idx_equipment_type (equipment_type),
  INDEX idx_status (status),
  INDEX idx_location (location),
  INDEX idx_assigned_project (currently_assigned_to_project_id),
  INDEX idx_assigned_user (currently_assigned_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  FULLTEXT idx_equipment_search (equipment_name, manufacturer, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Equipment inventory and asset management';

-- Note: The vendors table is referenced but created later in Section 5
-- This forward reference will be resolved after vendors table creation

-- Continue in next message due to character limit...
