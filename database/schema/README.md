# PMIS Tétouan - Database Schema Documentation

## Overview

This directory contains the complete MySQL 8.0 database schema for the PMIS (Project Management Information System) for the Prefecture of Tétouan's Equipment Division.

## Database Information

- **Database Name:** `pmis_tetouan`
- **MySQL Version:** 8.0+
- **Character Set:** UTF8MB4 (Full Unicode support)
- **Collation:** utf8mb4_unicode_ci
- **Normalization:** 3NF (Third Normal Form)
- **Tables:** 8 core tables
- **Storage Engine:** InnoDB

## Core Tables

### 1. **roles**
System role definitions with RBAC support.
- **Purpose:** Define user roles (ADMIN, PROJECT_MANAGER, etc.)
- **Key Fields:** name, name_fr, name_en, description
- **Relationships:** Referenced by users table
- **Predefined Roles:** 6 system roles

### 2. **users**
User accounts with authentication and profile management.
- **Purpose:** Store user credentials and profile information
- **Key Fields:** username, email, password_hash, role_id, preferred_language
- **Security:** Bcrypt password hashing, account lockout, password expiry
- **Features:** Failed login tracking, soft delete, audit trail

### 3. **projects**
Infrastructure projects managed by Division d'Équipement.
- **Purpose:** Track and manage infrastructure projects
- **Key Fields:** code, name_fr, status, phase, priority, health_status
- **Timeline:** start_date, planned_end_date, actual_end_date
- **Progress:** completion_percentage (0.00 to 100.00)
- **Features:** Project manager assignment, budget tracking, archiving

### 4. **milestones**
Project milestones and deliverables tracking.
- **Purpose:** Break projects into manageable phases
- **Key Fields:** name_fr, target_date, actual_date, status
- **Features:** Milestone dependencies, responsible user assignment
- **Progress:** completion_percentage per milestone

### 5. **budgets**
Project budget allocations and spending tracking.
- **Purpose:** Control project costs and prevent overruns
- **Key Fields:** fiscal_year, category, allocated_amount, actual_spending
- **Categories:** Personnel, Equipment, Materials, Contractors, Other
- **Alerts:** Threshold alerts at 50%, 75%, 90% utilization
- **Status:** On Track, At Risk, Exceeded

### 6. **equipment**
Equipment inventory and asset management.
- **Purpose:** Track all equipment assets (vehicles, machinery, tools)
- **Key Fields:** code, name, category, status, condition_status
- **Categories:** Vehicles, Machinery, Tools, Electronics, Furniture, Other
- **Features:** Depreciation tracking, usage monitoring (hours/km), barcode support

### 7. **vendors**
Vendor and supplier management for procurement.
- **Purpose:** Manage vendor relationships and performance
- **Key Fields:** code, name, contact_person, rating, payment_terms
- **Features:** Performance tracking, approval status, address management
- **Tracking:** total_orders, total_value

### 8. **approvals**
Multi-level approval workflow tracking.
- **Purpose:** Enforce governance and authorization procedures
- **Key Fields:** entity_type, entity_id, status, approval_level
- **Workflow:** Configurable multi-level approvals (1, 2, 3+ levels)
- **Status:** Pending, Approved, Rejected, Cancelled, On Hold
- **Features:** Priority levels, due dates, notification tracking

## Database Features

### ✅ 3NF Normalization
- No data redundancy
- Proper table relationships
- Referential integrity enforced

### 🔐 Security Features
- Bcrypt password hashing ($2b$10 rounds)
- Account lockout after 5 failed login attempts
- Password expiry and forced change support
- Soft deletes for audit trail

### 📊 Audit Trail
All tables include:
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp
- `created_by` - User ID who created the record
- `updated_by` - User ID who last modified the record
- `deleted_at` - Soft delete timestamp (NULL = active)

### 🚀 Performance Optimization
- **80+ indexes** across all tables
- Primary key indexes on all tables
- Foreign key indexes for JOIN operations
- Composite indexes for common queries
- Covering indexes for frequently accessed columns

### 🌍 Internationalization
- UTF8MB4 character set (supports French accents, Arabic, emojis)
- Dual-language fields (name_fr, name_en)
- User language preference (fr, en, ar)
- Timezone support (default: Africa/Casablanca)

### 🔗 Foreign Key Relationships

```
roles (1) →→ (N) users
users (1) →→ (N) projects (project_manager_id)
users (1) →→ (N) milestones (responsible_user_id)
projects (1) →→ (N) milestones
projects (1) →→ (N) budgets
milestones (1) →→ (1) milestones (dependencies)
users (1) →→ (N) equipment (created_by)
users (1) →→ (N) vendors (created_by)
users (1) →→ (N) approvals (requested_by, current_approver_id)
```

### ⚠️ Cascading Rules
- `ON DELETE CASCADE` - Child records deleted when parent is deleted
- `ON DELETE SET NULL` - Foreign key set to NULL when parent is deleted
- `ON DELETE RESTRICT` - Prevent deletion of parent if children exist
- `ON UPDATE CASCADE` - Update propagates to child records

## Installation

### Prerequisites
- MySQL 8.0 or higher
- MySQL Workbench (recommended) or MySQL CLI
- Sufficient database privileges (CREATE, INSERT, ALTER)

### Step 1: Create Database

```bash
mysql -u root -p
```

### Step 2: Execute Schema

```sql
-- Option 1: Execute from command line
source database/schema/02-create-tables.sql

-- Option 2: Copy-paste into MySQL Workbench
-- Open 02-create-tables.sql in MySQL Workbench and click Execute
```

### Step 3: Verify Installation

```sql
-- Check database was created
SHOW DATABASES LIKE 'pmis_tetouan';

-- Use the database
USE pmis_tetouan;

-- List all tables
SHOW TABLES;

-- Expected output:
-- +-------------------------+
-- | Tables_in_pmis_tetouan |
-- +-------------------------+
-- | approvals               |
-- | budgets                 |
-- | equipment               |
-- | milestones              |
-- | projects                |
-- | roles                   |
-- | users                   |
-- | vendors                 |
-- +-------------------------+
```

### Step 4: Verify Seed Data

```sql
-- Check roles were inserted (should be 6 roles)
SELECT id, name, name_fr, name_en FROM roles;

-- Check admin user was created
SELECT id, username, email, first_name, last_name, role_id FROM users;
```

## Default Credentials

### ⚠️ IMPORTANT SECURITY NOTICE

The schema includes a default admin account:

```
Username: admin
Password: Admin@2025
Email: admin@prefecture-tetouan.ma
```

**⚠️ YOU MUST CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

The account is flagged with `must_change_password = TRUE` to force a password change on first login.

## Database Maintenance

### Backup

```bash
# Full database backup
mysqldump -u root -p pmis_tetouan > pmis_tetouan_backup_$(date +%Y%m%d).sql

# Schema only (no data)
mysqldump -u root -p --no-data pmis_tetouan > pmis_tetouan_schema.sql

# Data only (no schema)
mysqldump -u root -p --no-create-info pmis_tetouan > pmis_tetouan_data.sql
```

### Restore

```bash
mysql -u root -p pmis_tetouan < pmis_tetouan_backup_20251121.sql
```

### Check Table Sizes

```sql
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'pmis_tetouan'
ORDER BY (data_length + index_length) DESC;
```

### Optimize Tables

```sql
-- Optimize all tables
OPTIMIZE TABLE roles, users, projects, milestones, budgets, equipment, vendors, approvals;
```

## Common Queries

### Active Users Count

```sql
SELECT COUNT(*) AS active_users 
FROM users 
WHERE is_active = TRUE AND deleted_at IS NULL;
```

### Projects by Status

```sql
SELECT status, COUNT(*) AS project_count
FROM projects
WHERE deleted_at IS NULL
GROUP BY status;
```

### Budget Utilization

```sql
SELECT 
    p.code AS project_code,
    p.name_fr AS project_name,
    SUM(b.allocated_amount) AS total_budget,
    SUM(b.actual_spending) AS total_spent,
    ROUND((SUM(b.actual_spending) / SUM(b.allocated_amount) * 100), 2) AS utilization_percentage
FROM projects p
JOIN budgets b ON p.id = b.project_id
WHERE p.deleted_at IS NULL
GROUP BY p.id;
```

### Equipment Availability

```sql
SELECT 
    category,
    status,
    COUNT(*) AS count
FROM equipment
WHERE deleted_at IS NULL
GROUP BY category, status
ORDER BY category, status;
```

## Table Relationships Diagram

```
                    ┌─────────────┐
                    │    roles     │
                    │ (PK: id)    │
                    └──────┬──────┘
                           │
                           │ 1:N
                           │
                    ┌──────┴──────┐
                    │    users     │
                    │ (PK: id)    │
                    │ (FK: role_id)│
                    └────┬───┬───┬───┘
                         │    │    │
              ┌────────┼────┼────┼────────┐
              │         │    │    │         │
      ┌───────┴────┐  │    │  ┌────┴───────┐
      │  projects  │  │    │  │  approvals  │
      │ (PK: id)  │  │    │  │ (PK: id)   │
      │ (FK: pm_id)│  │    │  │ (FK: req_by)│
      └───┬───┬────┘  │    │  └────────────┘
          │    │       │    │
          │    │       │    │
    ┌─────┼────┼─────┐ │    │
    │     │    │      │ │    │
┌───┴─────┐  │  ┌───┴─────┐  │  ┌──┴──────┐
│milestones│  │  │ budgets │  │  │ vendors  │
│(PK: id)  │  │  │(PK: id) │  │  │(PK: id) │
│(FK:proj)│  │  │(FK:proj)│  │  │(FK:cr_by)│
└─────────┘  │  └─────────┘  │  └─────────┘
               │                  │
               │                  │
          ┌────┴─────┐           │
          │ equipment│           │
          │ (PK: id) │───────────┘
          │(FK:cr_by)│
          └─────────┘
```

## Constraints Summary

### CHECK Constraints
- Budget amounts must be >= 0
- Completion percentages must be 0.00 to 100.00
- Dates must be logical (end >= start)
- Approval levels must be valid (1 to max_level)
- Vendor ratings must be 0.00 to 5.00

### UNIQUE Constraints
- `users.username` - No duplicate usernames
- `users.email` - No duplicate emails
- `projects.code` - No duplicate project codes
- `equipment.code` - No duplicate equipment codes
- `vendors.code` - No duplicate vendor codes
- `approvals.request_number` - No duplicate request numbers
- `budgets(project_id, category, fiscal_year)` - One budget per project/category/year

## Next Steps

After installing the database schema:

1. ✅ **Change the default admin password**
2. 📝 Create additional user accounts
3. 🚀 Set up the NestJS backend API
4. 🎨 Build the React frontend
5. 📊 Configure reporting views
6. 🔐 Set up automated backups
7. 📊 Set up monitoring and alerts

## Support

For issues or questions:
- **GitHub Issues:** [https://github.com/achrafChemsi1/pmis-tetouan/issues](https://github.com/achrafChemsi1/pmis-tetouan/issues)
- **Email:** contact@prefecture-tetouan.ma

## License

MIT License - See LICENSE file for details

---

**Prefecture of Tétouan - Division d'Équipement**  
**Ministry of Interior, Morocco**