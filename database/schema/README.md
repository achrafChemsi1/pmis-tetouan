# Database Schema Files

This directory contains the modular MySQL database schema for PMIS Tétouan.

## Execution Order

Execute these files in the following order:

### 1. Database Creation
```bash
mysql -u root -p < 01-create-database.sql
```

### 2. Table Creation
```bash
mysql -u root -p pmis_tetouan < 02-create-tables.sql
```

### 3. Index Creation
```bash
mysql -u root -p pmis_tetouan < 03-create-indexes.sql
```

### 4. View Creation
```bash
mysql -u root -p pmis_tetouan < 04-create-views.sql
```

## Database Statistics

- **Total Tables**: 21
- **Total Indexes**: 120+
- **Total Views**: 6
- **Character Set**: UTF8MB4 (full Unicode support)
- **Collation**: utf8mb4_unicode_ci (case-insensitive)

## Table List

### User Management (5 tables)
1. `users` - User accounts and authentication
2. `roles` - System roles
3. `user_roles` - User-to-role assignments
4. `permissions` - Granular permissions
5. `role_permissions` - Role-to-permission assignments

### Project Management (2 tables)
6. `projects` - Core project information
7. `milestones` - Project milestones and deliverables

### Budget Management (2 tables)
8. `budget_allocations` - Budget by category
9. `budget_transactions` - Individual transactions

### Equipment Management (3 tables)
10. `equipment` - Equipment inventory
11. `equipment_maintenance` - Maintenance history
12. `equipment_allocation` - Equipment assignments

### Procurement (3 tables)
13. `vendors` - Vendor/supplier master data
14. `purchase_orders` - Purchase orders
15. `purchase_order_items` - PO line items

### Workflow & Documents (2 tables)
16. `approvals` - Approval workflows
17. `documents` - Document management

### Resource & System (4 tables)
18. `resource_allocations` - Personnel assignments
19. `audit_log` - System audit trail
20. `notifications` - User notifications
21. `system_settings` - Application configuration

## Views

1. `active_projects` - Currently active projects
2. `project_budget_status` - Budget summary per project
3. `overdue_milestones` - Milestones past due date
4. `equipment_in_use` - Currently allocated equipment
5. `equipment_availability_summary` - Equipment by status
6. `pending_approvals_summary` - Approval workload

## Design Principles

- **Normalization**: All tables are in 3NF (Third Normal Form)
- **Soft Deletes**: `deleted_at` column for historical tracking
- **Audit Columns**: `created_at`, `updated_at`, `created_by`, `updated_by`
- **Foreign Keys**: Full referential integrity enforcement
- **Check Constraints**: Data validation at database level
- **Indexes**: Comprehensive indexing for performance
