# PMIS Tétouan - Complete Production Database Schema
## 21 Tables + 4 Views + Full RBAC

---

## 📊 Database Overview

- **Database Name:** `pmis_tetouan`
- **MySQL Version:** 8.0+
- **Character Set:** UTF8MB4 (Full Unicode)
- **Collation:** utf8mb4_unicode_ci
- **Storage Engine:** InnoDB
- **Normalization:** 3NF (Third Normal Form)
- **Total Tables:** 21
- **Total Views:** 4
- **Total Indexes:** 100+
- **Roles:** 6 predefined system roles
- **Permissions:** 28 fine-grained permissions

---

## 📝 Complete Table List

### **Section 1: Authentication & Authorization (5 tables)**
1. **users** - User accounts with authentication
2. **roles** - System roles (ADMIN, PROJECT_MANAGER, etc.)
3. **user_roles** - Many-to-many: Users ↔ Roles
4. **permissions** - Fine-grained permissions
5. **role_permissions** - Many-to-many: Roles ↔ Permissions

### **Section 2: Project Management (2 tables)**
6. **projects** - Core project information
7. **milestones** - Project phases and deliverables

### **Section 3: Budget Management (2 tables)**
8. **budget_allocations** - Budget by category
9. **budget_transactions** - Individual budget entries

### **Section 4: Equipment Management (3 tables)**
10. **equipment** - Equipment inventory
11. **equipment_maintenance** - Maintenance history
12. **equipment_allocation** - Assignment tracking

### **Section 5: Procurement & Vendors (3 tables)**
13. **vendors** - Supplier/contractor information
14. **purchase_orders** - Purchase order tracking
15. **purchase_order_items** - PO line items

### **Section 6: Workflow & Documentation (2 tables)**
16. **approvals** - Multi-level approval workflows
17. **documents** - Document management

### **Section 7: Resources (1 table)**
18. **resource_allocations** - Personnel assignment

### **Section 8: System Management (3 tables)**
19. **audit_log** - System activity tracking
20. **notifications** - User notifications
21. **system_settings** - Configuration

---

## 💾 Installation Instructions

### **Method 1: Execute All Files in Order**

```bash
# Connect to MySQL
mysql -u root -p

# Execute schema files in order
mysql -u root -p < database/schema/03-complete-schema-21-tables.sql
mysql -u root -p < database/schema/04-complete-schema-part2.sql
mysql -u root -p < database/schema/05-views-and-seed-data.sql
```

### **Method 2: MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your MySQL 8.0+ server
3. Open each file in order:
   - `03-complete-schema-21-tables.sql`
   - `04-complete-schema-part2.sql`
   - `05-views-and-seed-data.sql`
4. Execute each file (click lightning bolt icon)
5. Verify installation with queries below

---

## ✅ Verification Queries

### **Check All Tables Were Created**

```sql
USE pmis_tetouan;

SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'pmis_tetouan'
ORDER BY table_name;

-- Expected: 21 tables
```

### **Check Views Were Created**

```sql
SELECT table_name 
FROM information_schema.VIEWS 
WHERE table_schema = 'pmis_tetouan';

-- Expected: 4 views (v_active_projects, v_project_budget_status, etc.)
```

### **Check Roles Were Inserted**

```sql
SELECT id, role_name, display_name, is_system_role 
FROM roles;

-- Expected: 6 roles
```

### **Check Permissions Count**

```sql
SELECT COUNT(*) AS total_permissions FROM permissions;

-- Expected: 28 permissions
```

### **Check Role-Permission Mappings**

```sql
SELECT 
  r.role_name,
  COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id
ORDER BY r.id;

-- Expected: ADMIN has all permissions, others have subset
```

### **Check Admin User**

```sql
SELECT 
  u.id, u.username, u.email, 
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  r.role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;

-- Expected: 1 user (admin) with ADMIN role
```

---

## 🔐 Default Credentials

### **⚠️ IMPORTANT SECURITY NOTICE**

The schema includes a default admin account:

```
Username: admin
Password: Admin@2025
Email: admin@prefecture-tetouan.ma
Role: ADMIN
```

**⚠️ YOU MUST CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

### **Change Admin Password**

```sql
-- Example: Update admin password (use bcrypt hash from your application)
UPDATE users 
SET password_hash = '[NEW_BCRYPT_HASH]',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';
```

---

## 👥 System Roles & Permissions

### **1. ADMIN (Administrator)**
- **Permissions:** ALL (28 permissions)
- **Access:** Full system access
- **Can:**
  - Manage users and roles
  - Configure system settings
  - Access all modules
  - View audit logs
  - Export all data

### **2. PROJECT_MANAGER (Chef de Projet)**
- **Permissions:** 12 permissions
- **Access:** Project and budget management
- **Can:**
  - Create/edit/delete projects
  - Manage budgets
  - Allocate equipment
  - Create purchase requests
  - Generate reports

### **3. EQUIPMENT_OFFICER (Agent Matériel)**
- **Permissions:** 9 permissions
- **Access:** Equipment and procurement
- **Can:**
  - Manage equipment inventory
  - Track maintenance
  - Create/edit purchase orders
  - Allocate equipment to projects

### **4. FINANCE_CONTROLLER (Contrôleur Financier)**
- **Permissions:** 7 permissions
- **Access:** Budget approval and financial oversight
- **Can:**
  - Approve budgets and amendments
  - Approve purchase orders
  - View financial reports
  - Access audit logs

### **5. SUPERVISOR (Superviseur)**
- **Permissions:** Read-all + export
- **Access:** View-only across all modules
- **Can:**
  - View all projects and budgets
  - Generate and export reports
  - View audit logs
  - Monitor system activity

### **6. VIEWER (Lecteur)**
- **Permissions:** 2 permissions
- **Access:** Limited read-only
- **Can:**
  - View assigned projects only
  - View basic reports

---

## 📊 Business Intelligence Views

### **VIEW 1: v_active_projects**
**Purpose:** Quick overview of active projects

```sql
SELECT * FROM v_active_projects;
```

**Returns:**
- Project code, name, status
- Completion percentage
- Budget (estimated vs actual)
- Project manager name
- Days remaining until deadline

### **VIEW 2: v_project_budget_status**
**Purpose:** Budget utilization analysis

```sql
SELECT * FROM v_project_budget_status;
```

**Returns:**
- Total budget, spent, committed
- Remaining budget
- Utilization percentage
- Budget status (ON_TRACK, AT_RISK, EXCEEDED)

### **VIEW 3: v_overdue_milestones**
**Purpose:** Identify delayed milestones

```sql
SELECT * FROM v_overdue_milestones;
```

**Returns:**
- Milestone code, title, planned date
- Project information
- Responsible person
- Days overdue

### **VIEW 4: v_equipment_summary**
**Purpose:** Equipment availability and utilization

```sql
SELECT * FROM v_equipment_summary;
```

**Returns:**
- Equipment code, name, type, status
- Assigned project (if any)
- Location
- Maintenance schedule

---

## 🔍 Common Business Queries

### **1. Get Project with Budget Breakdown**

```sql
SELECT 
  p.project_code, p.project_name, p.status,
  ba.budget_category, ba.allocated_amount, ba.spent_amount,
  ROUND(100.0 * ba.spent_amount / ba.allocated_amount, 2) AS utilization_percent
FROM projects p
LEFT JOIN budget_allocations ba ON p.id = ba.project_id
WHERE p.id = [PROJECT_ID] AND p.deleted_at IS NULL;
```

### **2. List Delayed Projects**

```sql
SELECT 
  p.project_code, p.project_name, p.planned_end_date,
  DATEDIFF(CURDATE(), p.planned_end_date) AS days_overdue,
  CONCAT(u.first_name, ' ', u.last_name) AS project_manager
FROM projects p
LEFT JOIN users u ON p.project_manager_id = u.id
WHERE p.status != 'COMPLETED' 
  AND p.planned_end_date < CURDATE() 
  AND p.deleted_at IS NULL
ORDER BY days_overdue DESC;
```

### **3. Budget Alerts - Projects Over Budget**

```sql
SELECT 
  p.project_code, p.project_name,
  SUM(ba.allocated_amount) AS budget,
  SUM(ba.spent_amount) AS spent,
  (SUM(ba.spent_amount) - SUM(ba.allocated_amount)) AS overage
FROM projects p
JOIN budget_allocations ba ON p.id = ba.project_id
GROUP BY p.id
HAVING SUM(ba.spent_amount) > SUM(ba.allocated_amount)
ORDER BY overage DESC;
```

### **4. Pending Approvals for User**

```sql
SELECT 
  a.approval_code, a.request_type, a.request_id,
  CONCAT(u.first_name, ' ', u.last_name) AS requester,
  DATEDIFF(CURDATE(), a.submitted_date) AS days_pending
FROM approvals a
JOIN users u ON a.created_by = u.id
WHERE a.required_approver_user_id = [USER_ID] 
  AND a.status = 'PENDING'
ORDER BY a.submitted_date ASC;
```

### **5. Equipment Availability by Type**

```sql
SELECT 
  equipment_type,
  status,
  COUNT(*) AS count
FROM equipment
WHERE deleted_at IS NULL
GROUP BY equipment_type, status
ORDER BY equipment_type, status;
```

---

## 🛡️ Security Features

### **Authentication**
- Bcrypt password hashing ($2b$10 rounds)
- Account lockout after 5 failed login attempts
- Password reset tokens with expiration
- Two-factor authentication support (field reserved)

### **Authorization**
- Role-Based Access Control (RBAC)
- Fine-grained permissions (28 permissions)
- Permission inheritance through roles

### **Audit Trail**
- All tables have created_at, updated_at, created_by, updated_by
- Comprehensive audit_log table for all changes
- Soft deletes (deleted_at) for historical tracking
- Sensitive operation flagging

### **Data Protection**
- UTF8MB4 encoding prevents injection attacks
- CHECK constraints for data validation
- Foreign key constraints for referential integrity
- Encrypted fields (bank_account, etc.)

---

## 🚀 Performance Optimization

### **Indexing Strategy**
- Primary keys on all tables
- Foreign key indexes for JOINs
- Composite indexes on frequently queried columns
- FULLTEXT indexes on searchable text fields
- Total: 100+ indexes across 21 tables

### **Query Optimization**
- 4 pre-built views for common queries
- Optimized JOIN paths
- Pagination support
- Date range filtering

### **Data Management**
- Soft deletes preserve referential integrity
- Cascading deletes where appropriate
- SET NULL for optional relationships
- RESTRICT for critical relationships

---

## 📁 Database Size Estimates

| Year | Tables | Rows (Est.) | Size (Est.) |
|------|--------|-------------|-------------|
| 1    | 21     | ~50,000     | ~500 MB     |
| 3    | 21     | ~200,000    | ~2 GB       |
| 5    | 21     | ~500,000    | ~5-10 GB    |

---

## 💾 Backup & Maintenance

### **Daily Backup**

```bash
# Full backup
mysqldump -u root -p pmis_tetouan > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -u root -p pmis_tetouan | gzip > backup_$(date +%Y%m%d).sql.gz
```

### **Restore Backup**

```bash
mysql -u root -p pmis_tetouan < backup_20251121.sql
```

### **Optimize Tables**

```sql
-- Optimize all tables monthly
OPTIMIZE TABLE users, roles, user_roles, permissions, role_permissions,
  projects, milestones, budget_allocations, budget_transactions,
  equipment, equipment_maintenance, equipment_allocation,
  vendors, purchase_orders, purchase_order_items,
  approvals, documents, resource_allocations,
  audit_log, notifications, system_settings;
```

---

## 📝 Next Steps

After installing the database:

1. ✅ **Change the default admin password**
2. 👥 Create additional user accounts
3. ⚙️ Configure system settings
4. 💾 Set up automated backups (cron job)
5. 🚀 Install NestJS backend API
6. 🎨 Install React frontend application
7. 📊 Configure monitoring (Prometheus/Grafana)
8. 📧 Set up email notifications

---

## 📞 Support

- **GitHub Issues:** [https://github.com/achrafChemsi1/pmis-tetouan/issues](https://github.com/achrafChemsi1/pmis-tetouan/issues)
- **Email:** contact@prefecture-tetouan.ma
- **Documentation:** See `/docs` folder

---

## 📜 License

MIT License - See LICENSE file for details

---

**Prefecture of Tétouan - Division d'Équipement**  
**Ministry of Interior, Morocco**  
**Developed with ❤️ for the people of Tétouan**
