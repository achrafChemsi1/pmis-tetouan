-- ============================================================================
-- PMIS TÉTOUAN - PART 3: VIEWS, SEED DATA, AND QUERIES
-- Business Intelligence Views, Initial Data, and Common Queries
-- ============================================================================

USE pmis_tetouan;

-- ============================================================================
-- SECTION 8: BUSINESS INTELLIGENCE VIEWS
-- ============================================================================

-- VIEW 1: Active Projects Summary
-- Purpose: Quick overview of active projects
-- ============================================================================
CREATE OR REPLACE VIEW v_active_projects AS
SELECT 
  p.id,
  p.project_code,
  p.project_name,
  p.status,
  p.completion_percentage,
  p.estimated_budget,
  p.actual_budget,
  CONCAT(u.first_name, ' ', u.last_name) AS project_manager,
  p.start_date,
  p.planned_end_date,
  DATEDIFF(p.planned_end_date, CURDATE()) AS days_remaining
FROM projects p
LEFT JOIN users u ON p.project_manager_id = u.id
WHERE p.status IN ('PLANNING', 'IN_PROGRESS') 
  AND p.deleted_at IS NULL;

-- VIEW 2: Project Budget Status
-- Purpose: Budget utilization analysis
-- ============================================================================
CREATE OR REPLACE VIEW v_project_budget_status AS
SELECT 
  p.id AS project_id,
  p.project_code,
  p.project_name,
  SUM(ba.allocated_amount) AS total_budget,
  SUM(ba.spent_amount) AS total_spent,
  SUM(ba.committed_amount) AS total_committed,
  (SUM(ba.allocated_amount) - SUM(ba.spent_amount)) AS remaining_budget,
  ROUND(100.0 * SUM(ba.spent_amount) / NULLIF(SUM(ba.allocated_amount), 0), 2) AS utilization_percent,
  CASE
    WHEN SUM(ba.spent_amount) > SUM(ba.allocated_amount) THEN 'EXCEEDED'
    WHEN SUM(ba.spent_amount) / NULLIF(SUM(ba.allocated_amount), 0) >= 0.90 THEN 'AT_RISK'
    ELSE 'ON_TRACK'
  END AS budget_status
FROM projects p
LEFT JOIN budget_allocations ba ON p.id = ba.project_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.project_code, p.project_name;

-- VIEW 3: Overdue Milestones
-- Purpose: Identify delayed milestones
-- ============================================================================
CREATE OR REPLACE VIEW v_overdue_milestones AS
SELECT 
  m.id AS milestone_id,
  m.milestone_code,
  m.title AS milestone_title,
  m.planned_date,
  m.status,
  m.project_id,
  p.project_code,
  p.project_name,
  CONCAT(u.first_name, ' ', u.last_name) AS responsible_person,
  DATEDIFF(CURDATE(), m.planned_date) AS days_overdue
FROM milestones m
JOIN projects p ON m.project_id = p.id
LEFT JOIN users u ON m.responsible_user_id = u.id
WHERE m.status NOT IN ('COMPLETED', 'CANCELLED') 
  AND m.planned_date < CURDATE()
  AND p.deleted_at IS NULL
ORDER BY days_overdue DESC;

-- VIEW 4: Equipment Usage Summary
-- Purpose: Equipment availability and utilization
-- ============================================================================
CREATE OR REPLACE VIEW v_equipment_summary AS
SELECT 
  e.id AS equipment_id,
  e.equipment_code,
  e.equipment_name,
  e.equipment_type,
  e.status,
  e.currently_assigned_to_project_id,
  p.project_code AS assigned_project_code,
  p.project_name AS assigned_project_name,
  e.assignment_date,
  e.location,
  DATEDIFF(CURDATE(), e.last_maintenance_date) AS days_since_maintenance,
  e.next_maintenance_date
FROM equipment e
LEFT JOIN projects p ON e.currently_assigned_to_project_id = p.id
WHERE e.deleted_at IS NULL;

-- ============================================================================
-- SECTION 9: SEED DATA - SYSTEM ROLES
-- ============================================================================

INSERT INTO roles (role_name, display_name, description, is_system_role) VALUES
('ADMIN', 'Administrator', 'Full system access with all permissions. Can manage users, configure settings, and access all modules.', TRUE),
('PROJECT_MANAGER', 'Project Manager', 'Create and manage projects, assign resources, track progress, manage budgets, and generate reports.', TRUE),
('EQUIPMENT_OFFICER', 'Equipment Officer', 'Manage equipment inventory, track allocations, record maintenance activities, and manage procurement.', TRUE),
('FINANCE_CONTROLLER', 'Finance Controller', 'Review and approve budgets, track spending, approve procurement requests, and generate financial reports.', TRUE),
('SUPERVISOR', 'Supervisor', 'View project status, generate reports, monitor budgets, and export data for ministry reporting.', TRUE),
('VIEWER', 'Viewer', 'Read-only access to assigned projects and reports. Limited to viewing information only.', TRUE);

-- ============================================================================
-- SECTION 10: SEED DATA - PERMISSIONS
-- ============================================================================

INSERT INTO permissions (permission_code, display_name, description, resource_type, action) VALUES
-- Project permissions
('project_create', 'Create Projects', 'Create new projects', 'PROJECT', 'CREATE'),
('project_read', 'View Projects', 'View project information', 'PROJECT', 'READ'),
('project_update', 'Edit Projects', 'Edit project information', 'PROJECT', 'UPDATE'),
('project_delete', 'Delete Projects', 'Delete projects', 'PROJECT', 'DELETE'),
('project_approve', 'Approve Projects', 'Approve project requests', 'PROJECT', 'APPROVE'),

-- Budget permissions
('budget_create', 'Create Budgets', 'Create budget allocations', 'BUDGET', 'CREATE'),
('budget_read', 'View Budgets', 'View budget information', 'BUDGET', 'READ'),
('budget_update', 'Edit Budgets', 'Edit budget information', 'BUDGET', 'UPDATE'),
('budget_approve', 'Approve Budgets', 'Approve budget amendments', 'BUDGET', 'APPROVE'),

-- Equipment permissions
('equipment_create', 'Add Equipment', 'Add new equipment to inventory', 'EQUIPMENT', 'CREATE'),
('equipment_read', 'View Equipment', 'View equipment information', 'EQUIPMENT', 'READ'),
('equipment_update', 'Edit Equipment', 'Edit equipment information', 'EQUIPMENT', 'UPDATE'),
('equipment_delete', 'Delete Equipment', 'Delete equipment from inventory', 'EQUIPMENT', 'DELETE'),
('equipment_allocate', 'Allocate Equipment', 'Assign equipment to projects', 'EQUIPMENT', 'ALLOCATE'),

-- Procurement permissions
('purchase_create', 'Create Purchase Orders', 'Create purchase orders', 'PURCHASE', 'CREATE'),
('purchase_read', 'View Purchase Orders', 'View purchase order information', 'PURCHASE', 'READ'),
('purchase_update', 'Edit Purchase Orders', 'Edit purchase orders', 'PURCHASE', 'UPDATE'),
('purchase_approve', 'Approve Purchase Orders', 'Approve purchase orders', 'PURCHASE', 'APPROVE'),

-- User management permissions
('user_create', 'Create Users', 'Create new user accounts', 'USER', 'CREATE'),
('user_read', 'View Users', 'View user information', 'USER', 'READ'),
('user_update', 'Edit Users', 'Edit user information', 'USER', 'UPDATE'),
('user_delete', 'Delete Users', 'Delete user accounts', 'USER', 'DELETE'),

-- Report permissions
('report_read', 'View Reports', 'View and generate reports', 'REPORT', 'READ'),
('report_export', 'Export Reports', 'Export reports to PDF/Excel', 'REPORT', 'EXPORT'),

-- Audit permissions
('audit_read', 'View Audit Logs', 'View system audit logs', 'AUDIT', 'READ'),

-- Settings permissions
('settings_update', 'Modify Settings', 'Modify system settings', 'SETTINGS', 'UPDATE');

-- ============================================================================
-- SECTION 11: SEED DATA - ROLE PERMISSIONS (RBAC)
-- ============================================================================

-- ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- PROJECT_MANAGER: Project, Budget, Equipment allocation, Purchase view, Report
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE permission_code IN (
  'project_create', 'project_read', 'project_update',
  'budget_create', 'budget_read', 'budget_update',
  'equipment_read', 'equipment_allocate',
  'purchase_create', 'purchase_read', 'purchase_update',
  'report_read', 'report_export'
);

-- EQUIPMENT_OFFICER: Equipment management, Purchase, Report view
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE permission_code IN (
  'equipment_create', 'equipment_read', 'equipment_update', 'equipment_delete', 'equipment_allocate',
  'purchase_create', 'purchase_read', 'purchase_update',
  'report_read'
);

-- FINANCE_CONTROLLER: Budget and Purchase approvals, Report access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE permission_code IN (
  'budget_read', 'budget_approve',
  'purchase_read', 'purchase_approve',
  'report_read', 'report_export',
  'audit_read'
);

-- SUPERVISOR: Read access to all, Export reports, Audit view
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE action = 'READ' OR permission_code IN ('report_export', 'audit_read');

-- VIEWER: Limited read access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE permission_code IN (
  'project_read', 'report_read'
);

-- ============================================================================
-- SECTION 12: SEED DATA - DEFAULT ADMIN USER
-- ============================================================================

-- Default admin user (password: Admin@2025)
INSERT INTO users (email, username, password_hash, first_name, last_name, department, is_active, preferred_language)
VALUES (
  'admin@prefecture-tetouan.ma',
  'admin',
  '$2b$10$K8X1p/a0dL3.hsVjyf1p38OeAo3ksIfhGeLQQfLpDxGbWPGXLEgI6K',
  'System',
  'Administrator',
  'IT - Division d''Équipement',
  TRUE,
  'fr'
);

-- Assign ADMIN role to default user
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES (1, 1, 1);

-- ============================================================================
-- SECTION 13: SEED DATA - SYSTEM SETTINGS
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('system_name', 'PMIS Tétouan', 'STRING', 'System display name'),
('default_language', 'fr', 'STRING', 'Default system language'),
('budget_alert_threshold', '90', 'INT', 'Budget utilization alert threshold (%)'),
('default_project_duration_days', '180', 'INT', 'Default project duration in days'),
('max_concurrent_user_sessions', '10', 'INT', 'Maximum concurrent sessions per user'),
('notification_email_enabled', 'true', 'BOOLEAN', 'Enable email notifications'),
('equipment_maintenance_reminder_days', '7', 'INT', 'Days before maintenance to send reminder'),
('password_expiry_days', '90', 'INT', 'Password expiration period'),
('session_timeout_minutes', '30', 'INT', 'Session timeout in minutes'),
('max_failed_login_attempts', '5', 'INT', 'Maximum failed login attempts before lockout');

-- ============================================================================
-- SECTION 14: COMMON BUSINESS QUERIES
-- ============================================================================

/*
-- Query 1: Get project with complete budget breakdown
SELECT 
  p.id, p.project_code, p.project_name, p.status,
  ba.budget_category, ba.allocated_amount, ba.spent_amount,
  ROUND(100.0 * ba.spent_amount / ba.allocated_amount, 2) AS utilization_percent
FROM projects p
LEFT JOIN budget_allocations ba ON p.id = ba.project_id
WHERE p.id = ? AND p.deleted_at IS NULL;

-- Query 2: List delayed projects
SELECT 
  p.id, p.project_code, p.project_name, p.planned_end_date, p.completion_percentage,
  DATEDIFF(CURDATE(), p.planned_end_date) AS days_overdue,
  CONCAT(u.first_name, ' ', u.last_name) AS project_manager
FROM projects p
LEFT JOIN users u ON p.project_manager_id = u.id
WHERE p.status != 'COMPLETED' 
  AND p.planned_end_date < CURDATE() 
  AND p.deleted_at IS NULL
ORDER BY days_overdue DESC;

-- Query 3: Budget alerts - Projects exceeding budget
SELECT 
  p.id, p.project_code, p.project_name,
  SUM(ba.allocated_amount) AS budget,
  SUM(ba.spent_amount) AS spent,
  (SUM(ba.spent_amount) - SUM(ba.allocated_amount)) AS overage,
  ROUND(100.0 * SUM(ba.spent_amount) / SUM(ba.allocated_amount), 2) AS utilization_percent
FROM projects p
JOIN budget_allocations ba ON p.id = ba.project_id
GROUP BY p.id
HAVING SUM(ba.spent_amount) > SUM(ba.allocated_amount)
ORDER BY overage DESC;

-- Query 4: Pending approvals for user
SELECT 
  a.id, a.approval_code, a.request_type, a.request_id,
  CONCAT(u.first_name, ' ', u.last_name) AS requester,
  a.submitted_date,
  DATEDIFF(CURDATE(), a.submitted_date) AS days_pending
FROM approvals a
JOIN users u ON a.created_by = u.id
WHERE a.required_approver_user_id = ? 
  AND a.status = 'PENDING'
ORDER BY a.submitted_date ASC;

-- Query 5: Equipment availability by type and status
SELECT 
  equipment_type,
  status,
  COUNT(*) AS count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY equipment_type), 2) AS percentage
FROM equipment
WHERE deleted_at IS NULL
GROUP BY equipment_type, status
ORDER BY equipment_type, status;

-- Query 6: Project resource allocation summary
SELECT 
  p.project_code,
  p.project_name,
  CONCAT(u.first_name, ' ', u.last_name) AS team_member,
  ra.role_on_project,
  ra.allocation_percentage,
  ra.allocation_status
FROM projects p
JOIN resource_allocations ra ON p.id = ra.project_id
JOIN users u ON ra.user_id = u.id
WHERE ra.allocation_status = 'ACTIVE'
  AND p.deleted_at IS NULL
ORDER BY p.project_code, u.last_name;

-- Query 7: Vendor performance summary
SELECT 
  v.vendor_code,
  v.vendor_name,
  v.rating,
  COUNT(po.id) AS total_orders,
  SUM(po.po_amount) AS total_value,
  ROUND(AVG(DATEDIFF(po.actual_delivery_date, po.required_delivery_date)), 0) AS avg_delay_days
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
WHERE v.is_active = TRUE
GROUP BY v.id
ORDER BY total_value DESC;

-- Query 8: Monthly project cost trend
SELECT 
  DATE_FORMAT(bt.transaction_date, '%Y-%m') AS month,
  p.project_code,
  p.project_name,
  SUM(bt.amount) AS monthly_spending
FROM budget_transactions bt
JOIN budget_allocations ba ON bt.budget_allocation_id = ba.id
JOIN projects p ON ba.project_id = p.id
WHERE bt.transaction_type = 'EXPENSE'
  AND bt.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY month, p.id
ORDER BY month DESC, monthly_spending DESC;
*/

-- ============================================================================
-- SECTION 15: VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'pmis_tetouan'
ORDER BY table_name;

-- Verify roles were inserted
SELECT id, role_name, display_name, is_system_role FROM roles;

-- Verify permissions were inserted
SELECT COUNT(*) AS total_permissions FROM permissions;

-- Verify role-permission mappings
SELECT 
  r.role_name,
  COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id
ORDER BY r.id;

-- Verify admin user was created
SELECT 
  u.id, u.username, u.email, u.first_name, u.last_name,
  r.role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;

-- Verify system settings
SELECT setting_key, setting_value, setting_type FROM system_settings;

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================

/*
SUCCESS! PMIS Tétouan database schema installation complete.

Database: pmis_tetouan
Tables Created: 21
Views Created: 4
Roles Inserted: 6
Permissions Inserted: 28
Default Admin User: admin / Admin@2025

⚠️ IMPORTANT: Change the default admin password immediately!

Next Steps:
1. Change admin password
2. Create additional user accounts
3. Configure system settings
4. Set up automated backups
5. Install backend API (NestJS)
6. Install frontend application (React)

For support: contact@prefecture-tetouan.ma
*/
