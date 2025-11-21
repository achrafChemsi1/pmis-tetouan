-- ============================================================================
-- PMIS TÉTOUAN - COMPLETE SCHEMA PART 2
-- Continuation of 03-complete-schema-21-tables.sql
-- Tables 11-21, Views, and Seed Data
-- ============================================================================

USE pmis_tetouan;

-- ============================================================================
-- SECTION 4 (CONTINUED): EQUIPMENT MANAGEMENT TABLES
-- ============================================================================

-- TABLE 11: EQUIPMENT_MAINTENANCE (Maintenance History)
-- Purpose: Track equipment maintenance history
-- ============================================================================
CREATE TABLE equipment_maintenance (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT UNSIGNED NOT NULL COMMENT 'Equipment being maintained',
  maintenance_date DATE NOT NULL,
  maintenance_type ENUM('PREVENTIVE', 'CORRECTIVE', 'INSPECTION') NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  vendor_id INT UNSIGNED NULL,
  spare_parts_used TEXT NULL,
  technician_name VARCHAR(100) NULL,
  estimated_hours DECIMAL(5,2) NULL,
  actual_hours DECIMAL(5,2) NULL,
  condition_before ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR') NULL,
  condition_after ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR') NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completion_date DATE NULL,
  next_maintenance_date DATE NULL,
  notes TEXT NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_equipment_maintenance_equipment FOREIGN KEY (equipment_id) 
    REFERENCES equipment(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_maintenance_vendor FOREIGN KEY (vendor_id) 
    REFERENCES vendors(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_maintenance_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_equipment_maintenance_cost CHECK (cost >= 0),
  CONSTRAINT chk_equipment_maintenance_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  CONSTRAINT chk_equipment_maintenance_actual_hours CHECK (actual_hours IS NULL OR actual_hours >= 0),
  
  -- Indexes
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_maintenance_date (maintenance_date),
  INDEX idx_maintenance_type (maintenance_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Equipment maintenance history';

-- TABLE 12: EQUIPMENT_ALLOCATION (Equipment Assignment History)
-- Purpose: Track equipment assignments to projects
-- ============================================================================
CREATE TABLE equipment_allocation (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED NOT NULL,
  allocated_by_user_id INT UNSIGNED NOT NULL,
  allocation_date DATE NOT NULL,
  planned_return_date DATE NULL,
  actual_return_date DATE NULL,
  status ENUM('ACTIVE', 'RETURNED', 'LOST', 'DAMAGED') NOT NULL DEFAULT 'ACTIVE',
  usage_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  usage_kilometers DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  allocation_notes TEXT NULL,
  return_condition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  returned_at DATETIME NULL,
  returned_by_user_id INT UNSIGNED NULL,
  
  -- Foreign keys
  CONSTRAINT fk_equipment_allocation_equipment FOREIGN KEY (equipment_id) 
    REFERENCES equipment(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_allocation_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_allocation_allocated_by FOREIGN KEY (allocated_by_user_id) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_allocation_returned_by FOREIGN KEY (returned_by_user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_equipment_allocation_return CHECK (actual_return_date IS NULL OR actual_return_date >= allocation_date),
  CONSTRAINT chk_equipment_allocation_hours CHECK (usage_hours >= 0),
  CONSTRAINT chk_equipment_allocation_kilometers CHECK (usage_kilometers >= 0),
  
  -- Indexes
  INDEX idx_equipment_id (equipment_id),
  INDEX idx_project_id (project_id),
  INDEX idx_allocation_date (allocation_date),
  INDEX idx_status (status),
  UNIQUE KEY uk_equipment_allocation (equipment_id, project_id, allocation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Equipment assignment history';

-- ============================================================================
-- SECTION 5: PROCUREMENT & VENDOR MANAGEMENT TABLES
-- ============================================================================

-- TABLE 13: VENDORS (Supplier & Contractor Information)
-- Purpose: Manage vendor relationships
-- ============================================================================
CREATE TABLE vendors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_code VARCHAR(50) NOT NULL UNIQUE,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type ENUM('SUPPLIER', 'CONTRACTOR', 'SERVICE_PROVIDER', 'OTHER') NOT NULL,
  contact_person VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  mobile VARCHAR(20) NULL,
  fax VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NULL,
  tax_id VARCHAR(50) NULL,
  bank_account VARCHAR(255) NULL COMMENT 'Encrypted',
  payment_terms VARCHAR(100) NULL,
  currency_preference CHAR(3) NOT NULL DEFAULT 'MAD',
  rating DECIMAL(3,2) NULL COMMENT '0-5 star rating',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  updated_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_vendors_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_vendors_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_vendors_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  
  -- Indexes
  INDEX idx_vendor_code (vendor_code),
  INDEX idx_vendor_type (vendor_type),
  INDEX idx_is_active (is_active),
  INDEX idx_city (city),
  FULLTEXT idx_vendor_search (vendor_name, contact_person)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Vendor and supplier management';

-- TABLE 14: PURCHASE_ORDERS (Procurement Tracking)
-- Purpose: Track purchase orders and procurement
-- ============================================================================
CREATE TABLE purchase_orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(50) NOT NULL UNIQUE,
  project_id INT UNSIGNED NULL,
  vendor_id INT UNSIGNED NOT NULL,
  po_date DATE NOT NULL,
  required_delivery_date DATE NULL,
  actual_delivery_date DATE NULL,
  po_amount DECIMAL(15,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'MAD',
  po_status ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'INVOICED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  approved_by_user_id INT UNSIGNED NULL,
  approval_date DATETIME NULL,
  description TEXT NOT NULL,
  items_count INT NULL,
  invoice_received BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_number VARCHAR(100) NULL,
  invoice_date DATE NULL,
  invoice_amount DECIMAL(15,2) NULL,
  invoice_file_url VARCHAR(500) NULL,
  payment_date DATE NULL,
  delivery_location VARCHAR(255) NULL,
  delivery_contact VARCHAR(100) NULL,
  notes TEXT NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  updated_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_purchase_orders_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_orders_vendor FOREIGN KEY (vendor_id) 
    REFERENCES vendors(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_orders_approved_by FOREIGN KEY (approved_by_user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_orders_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_purchase_orders_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_purchase_orders_amount CHECK (po_amount > 0),
  CONSTRAINT chk_purchase_orders_date CHECK (po_date <= CURDATE()),
  
  -- Indexes
  INDEX idx_po_number (po_number),
  INDEX idx_project_id (project_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_po_status (po_status),
  INDEX idx_approval_status (approval_status),
  INDEX idx_po_date (po_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Purchase orders and procurement tracking';

-- TABLE 15: PURCHASE_ORDER_ITEMS (Line Items in PO)
-- Purpose: Track individual items in purchase orders
-- ============================================================================
CREATE TABLE purchase_order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT UNSIGNED NOT NULL,
  item_number INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  quantity_received DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quality_status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'PARTIAL') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_purchase_order_items_po FOREIGN KEY (purchase_order_id) 
    REFERENCES purchase_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_purchase_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchase_order_items_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_purchase_order_items_total_price CHECK (total_price >= 0),
  CONSTRAINT chk_purchase_order_items_received CHECK (quantity_received >= 0 AND quantity_received <= quantity),
  
  -- Indexes
  INDEX idx_purchase_order_id (purchase_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Purchase order line items';

-- ============================================================================
-- SECTION 6: WORKFLOW & DOCUMENTATION TABLES
-- ============================================================================

-- TABLE 16: APPROVALS (Workflow Approvals)
-- Purpose: Manage approval workflows
-- ============================================================================
CREATE TABLE approvals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  approval_code VARCHAR(100) NOT NULL UNIQUE,
  request_type ENUM('PROJECT', 'BUDGET', 'PURCHASE_ORDER', 'BUDGET_AMENDMENT', 'EQUIPMENT_ALLOCATION') NOT NULL,
  request_id INT UNSIGNED NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELEGATED') NOT NULL DEFAULT 'PENDING',
  approval_level INT NOT NULL DEFAULT 1,
  total_approval_levels INT NOT NULL DEFAULT 1,
  required_approver_user_id INT UNSIGNED NOT NULL,
  approver_user_id INT UNSIGNED NULL,
  approval_date DATETIME NULL,
  rejection_reason TEXT NULL,
  comments TEXT NULL,
  supporting_documents TEXT NULL COMMENT 'JSON array of document IDs',
  submitted_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_approvals_required_approver FOREIGN KEY (required_approver_user_id) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_approver FOREIGN KEY (approver_user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_approvals_level CHECK (approval_level <= total_approval_levels AND approval_level >= 1),
  
  -- Indexes
  INDEX idx_approval_code (approval_code),
  INDEX idx_request_type (request_type),
  INDEX idx_status (status),
  INDEX idx_required_approver (required_approver_user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Approval workflow tracking';

-- TABLE 17: DOCUMENTS (Project & System Documentation)
-- Purpose: Manage project documents
-- ============================================================================
CREATE TABLE documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_code VARCHAR(50) NOT NULL UNIQUE,
  project_id INT UNSIGNED NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type ENUM('CONTRACT', 'SPECIFICATION', 'PLAN', 'REPORT', 'RECEIPT', 'PHOTO', 'APPROVAL', 'OTHER') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT UNSIGNED NOT NULL COMMENT 'In bytes',
  file_type VARCHAR(20) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  description TEXT NULL,
  validity_start DATE NULL,
  validity_end DATE NULL,
  is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
  access_level ENUM('PUBLIC', 'INTERNAL', 'RESTRICTED') NOT NULL DEFAULT 'INTERNAL',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT UNSIGNED NOT NULL,
  last_accessed_at DATETIME NULL,
  deletion_scheduled_at DATE NULL,
  
  -- Foreign keys
  CONSTRAINT fk_documents_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Indexes
  INDEX idx_document_code (document_code),
  INDEX idx_project_id (project_id),
  INDEX idx_document_type (document_type),
  INDEX idx_uploaded_at (uploaded_at),
  FULLTEXT idx_document_search (document_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Document management';

-- TABLE 18: RESOURCE_ALLOCATIONS (Personnel Assignment)
-- Purpose: Track personnel assignments to projects
-- ============================================================================
CREATE TABLE resource_allocations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  allocation_percentage DECIMAL(5,2) NOT NULL COMMENT '0-100%',
  start_date DATE NOT NULL,
  end_date DATE NULL,
  role_on_project VARCHAR(100) NULL,
  allocation_status ENUM('ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  hourly_rate DECIMAL(10,2) NULL,
  notes TEXT NULL,
  
  -- Audit columns
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NOT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_resource_allocations_project FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_resource_allocations_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_resource_allocations_created_by FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- Check constraints
  CONSTRAINT chk_resource_allocations_percentage CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  CONSTRAINT chk_resource_allocations_dates CHECK (end_date IS NULL OR end_date >= start_date),
  
  -- Unique constraint
  UNIQUE KEY uk_resource_allocation (project_id, user_id, start_date),
  
  -- Indexes
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_allocation_status (allocation_status),
  INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Personnel assignment to projects';

-- ============================================================================
-- SECTION 7: SYSTEM MANAGEMENT TABLES
-- ============================================================================

-- TABLE 19: AUDIT_LOG (System Activity Tracking)
-- Purpose: Track all system changes for compliance
-- ============================================================================
CREATE TABLE audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ARCHIVE') NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  reason_for_change TEXT NULL,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  
  -- Indexes
  INDEX idx_entity (entity_type, entity_id, created_at),
  INDEX idx_user_id (user_id, created_at),
  INDEX idx_created_at (created_at),
  INDEX idx_is_sensitive (is_sensitive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System activity audit trail';

-- TABLE 20: NOTIFICATIONS (System Notifications)
-- Purpose: Manage user notifications
-- ============================================================================
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  notification_type ENUM('MILESTONE_DUE', 'BUDGET_ALERT', 'APPROVAL_NEEDED', 'PROJECT_DELAY', 'MAINTENANCE_DUE', 'GENERAL_INFO') NOT NULL,
  related_entity_type VARCHAR(50) NULL,
  related_entity_id INT UNSIGNED NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME NULL,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at DATETIME NULL,
  action_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  
  -- Foreign keys
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  
  -- Indexes
  INDEX idx_user_id (user_id, is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User notifications';

-- TABLE 21: SYSTEM_SETTINGS (Configuration)
-- Purpose: Store system configuration
-- ============================================================================
CREATE TABLE system_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type ENUM('STRING', 'INT', 'DECIMAL', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
  description TEXT NULL,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT UNSIGNED NULL,
  
  -- Foreign keys
  CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System configuration settings';

-- Continue with views and seed data in the next section...
