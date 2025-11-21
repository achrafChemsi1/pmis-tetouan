# PMIS Tétouan - RESTful API Architecture
## Complete Backend API Specification

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Base URL & Versioning](#base-url--versioning)
3. [Authentication](#authentication)
4. [Authorization](#authorization)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Security](#security)
8. [Performance](#performance)
9. [Standards & Conventions](#standards--conventions)

---

## 🌐 Overview

### API Principles

- **RESTful Design**: Resource-based URLs with standard HTTP methods
- **JSON Format**: All requests and responses use JSON
- **Stateless**: Each request contains all necessary information
- **Secure**: JWT authentication, HTTPS only, input validation
- **Performant**: Caching, pagination, field selection, compression
- **Documented**: Comprehensive documentation with examples

### Technology Stack

- **Framework**: NestJS (Node.js)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator
- **ORM**: TypeORM / Prisma
- **Database**: MySQL 8.0+
- **Cache**: Redis
- **Documentation**: Swagger/OpenAPI

---

## 🔗 Base URL & Versioning

### Environments

```
Development: http://localhost:3000/api/v1
Staging:     https://staging-api.pmis.tetouan.gov.ma/api/v1
Production:  https://api.pmis.tetouan.gov.ma/api/v1
```

### API Versioning

- Version included in URL path: `/api/v1`
- Current version: **v1**
- Breaking changes require new version number
- Deprecated endpoints marked with `Deprecated` header

---

## 🔐 Authentication

### JWT Token-Based Authentication

All endpoints (except login) require authentication via JWT token.

#### Token Structure

**Access Token** (1 hour expiration):
```json
{
  "sub": "123",
  "email": "manager@tetouan.gov.ma",
  "firstName": "Ahmed",
  "lastName": "Ali",
  "roles": ["PROJECT_MANAGER"],
  "permissions": ["project_create", "project_read", "budget_read"],
  "iat": 1700000000,
  "exp": 1700003600
}
```

**Refresh Token** (30 days expiration):
```json
{
  "sub": "123",
  "tokenType": "refresh",
  "iat": 1700000000,
  "exp": 1702592000
}
```

#### Authentication Flow

1. **Login**: POST `/api/v1/auth/login` with credentials
2. **Receive Tokens**: Get `accessToken` and `refreshToken`
3. **Use Access Token**: Include in `Authorization` header
4. **Token Expiry**: Access token expires after 1 hour
5. **Refresh**: Use refresh token to get new access token
6. **Logout**: Invalidate both tokens

#### Request Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 🛡️ Authorization

### Role-Based Access Control (RBAC)

#### System Roles

1. **ADMIN** - Full system access
2. **PROJECT_MANAGER** - Create/manage projects and budgets
3. **EQUIPMENT_OFFICER** - Manage equipment inventory
4. **FINANCE_CONTROLLER** - Approve budgets and purchases
5. **SUPERVISOR** - View-only access + reports
6. **VIEWER** - Limited read-only access

#### Permission Checking

- Endpoints check user permissions from JWT token
- 403 Forbidden returned if user lacks permission
- Row-level security: Users only see their assigned projects

---

## 📡 API Endpoints

### 1. Authentication Module

#### POST `/auth/login`

Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "manager@tetouan.gov.ma",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "manager@tetouan.gov.ma",
      "firstName": "Ahmed",
      "lastName": "Ali",
      "roles": ["PROJECT_MANAGER"],
      "permissions": ["project_create", "project_read", "budget_read"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

**Errors:**
- `400` - Invalid email/password format
- `401` - Incorrect credentials
- `429` - Too many login attempts (rate limited)

---

#### POST `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

#### POST `/auth/logout`

Invalidate user session and tokens.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST `/auth/password-reset-request`

Request password reset email.

**Request Body:**
```json
{
  "email": "manager@tetouan.gov.ma"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

---

#### POST `/auth/password-reset`

Reset password with token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

#### POST `/auth/change-password`

Change password (authenticated users only).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `401` - Current password incorrect

---

### 2. Projects Module

#### GET `/projects`

List all projects with filtering, sorting, and pagination.

**Query Parameters:**
```
page: 1 (default)
limit: 20 (default, max 100)
status: PLANNING,IN_PROGRESS,COMPLETED
priority: LOW,MEDIUM,HIGH,CRITICAL
search: "infrastructure"
sortBy: project_name, created_at, start_date, estimated_budget
sortOrder: asc, desc
fields: id,project_code,project_name,status
createdAfter: 2025-01-01
createdBefore: 2025-12-31
budgetMin: 100000
budgetMax: 500000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "projectCode": "PROJ-2025-001",
        "projectName": "Infrastructure Project A",
        "description": "Detailed project description...",
        "projectType": "CONSTRUCTION",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "startDate": "2025-01-01",
        "plannedEndDate": "2025-06-30",
        "actualEndDate": null,
        "estimatedBudget": 500000.00,
        "actualBudget": 350000.00,
        "completionPercentage": 65.50,
        "budgetStatus": "ON_TRACK",
        "location": "Tétouan",
        "projectManager": {
          "id": 1,
          "firstName": "Ahmed",
          "lastName": "Ali",
          "email": "ahmed.ali@tetouan.gov.ma"
        },
        "createdAt": "2024-11-17T10:00:00Z",
        "updatedAt": "2025-11-17T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

#### POST `/projects`

Create new project.

**Required Permission:** `project_create`

**Request Body:**
```json
{
  "projectName": "New Infrastructure Project",
  "description": "Detailed project description...",
  "projectType": "CONSTRUCTION",
  "priority": "HIGH",
  "startDate": "2025-03-01",
  "plannedEndDate": "2025-12-31",
  "location": "Tétouan",
  "projectManagerId": 1,
  "alternateManagerId": 2,
  "estimatedBudget": 750000.00,
  "objectives": "Build new water distribution system",
  "keyDeliverables": "Operational water system serving 5000 households",
  "risks": "Weather delays, contractor availability"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 46,
    "projectCode": "PROJ-2025-046",
    "projectName": "New Infrastructure Project",
    "status": "PLANNING",
    "createdAt": "2025-11-17T16:00:00Z",
    ... (full project object)
  }
}
```

**Errors:**
- `400` - Validation errors
- `401` - Not authenticated
- `403` - No permission to create projects
- `422` - Business logic validation failed

---

#### GET `/projects/:id`

Get detailed project information.

**Required Permission:** `project_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectCode": "PROJ-2025-001",
    "projectName": "Infrastructure Project A",
    "description": "Full project description...",
    "projectType": "CONSTRUCTION",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "startDate": "2025-01-01",
    "plannedEndDate": "2025-06-30",
    "actualEndDate": null,
    "location": "Tétouan",
    "descriptionLocation": "Northern district near highway",
    "estimatedBudget": 500000.00,
    "actualBudget": 350000.00,
    "completionPercentage": 65.50,
    "budgetStatus": "ON_TRACK",
    "projectManager": {
      "id": 1,
      "firstName": "Ahmed",
      "lastName": "Ali",
      "email": "ahmed.ali@tetouan.gov.ma",
      "phone": "+212-6-12-34-56-78"
    },
    "alternateManager": {
      "id": 2,
      "firstName": "Fatima",
      "lastName": "Hassan"
    },
    "objectives": "Improve water infrastructure...",
    "keyDeliverables": "New water distribution system",
    "risks": "Weather, contractor availability",
    "notes": "Project notes...",
    "approvedBy": {
      "id": 3,
      "firstName": "Mohammed",
      "lastName": "Alami"
    },
    "approvalDate": "2024-12-15T10:00:00Z",
    "createdAt": "2024-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T15:30:00Z",
    "createdBy": { ... },
    "updatedBy": { ... }
  }
}
```

**Errors:**
- `404` - Project not found
- `403` - No permission to view this project

---

#### PUT `/projects/:id`

Update entire project (all fields required).

**Required Permission:** `project_update`

**Request Body:** (Same as POST, all fields required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... updated project ... }
}
```

---

#### PATCH `/projects/:id`

Partially update project (only provided fields updated).

**Required Permission:** `project_update`

**Request Body:**
```json
{
  "status": "ON_HOLD",
  "actualBudget": 355000.00,
  "notes": "Project temporarily paused due to weather"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... updated project ... }
}
```

---

#### DELETE `/projects/:id`

Soft delete project (archive).

**Required Permission:** `project_delete`

**Response (204 No Content)**

---

#### PUT `/projects/:id/status`

Update project status with validation.

**Required Permission:** `project_update`

**Request Body:**
```json
{
  "status": "COMPLETED",
  "actualEndDate": "2025-06-15",
  "completionNotes": "Project completed successfully, 15 days ahead of schedule"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... updated project ... }
}
```

---

#### GET `/projects/:id/budget`

Get detailed budget breakdown for project.

**Required Permission:** `budget_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projectId": 1,
    "projectCode": "PROJ-2025-001",
    "totalBudget": 500000.00,
    "totalSpent": 350000.00,
    "totalCommitted": 50000.00,
    "remaining": 100000.00,
    "utilizationPercent": 80.00,
    "status": "AT_RISK",
    "allocations": [
      {
        "id": 1,
        "category": "PERSONNEL",
        "allocated": 200000.00,
        "spent": 150000.00,
        "committed": 30000.00,
        "remaining": 20000.00,
        "utilizationPercent": 90.00,
        "alertThresholdPercent": 90,
        "isOverThreshold": true
      },
      {
        "id": 2,
        "category": "EQUIPMENT",
        "allocated": 150000.00,
        "spent": 100000.00,
        "committed": 20000.00,
        "remaining": 30000.00,
        "utilizationPercent": 80.00,
        "alertThresholdPercent": 90,
        "isOverThreshold": false
      },
      {
        "id": 3,
        "category": "MATERIALS",
        "allocated": 100000.00,
        "spent": 70000.00,
        "committed": 0.00,
        "remaining": 30000.00,
        "utilizationPercent": 70.00,
        "alertThresholdPercent": 90,
        "isOverThreshold": false
      },
      {
        "id": 4,
        "category": "CONTRACTORS",
        "allocated": 50000.00,
        "spent": 30000.00,
        "committed": 0.00,
        "remaining": 20000.00,
        "utilizationPercent": 60.00,
        "alertThresholdPercent": 90,
        "isOverThreshold": false
      }
    ]
  }
}
```

---

#### GET `/projects/:id/milestones`

Get all milestones for project.

**Required Permission:** `project_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projectId": 1,
    "milestones": [
      {
        "id": 1,
        "milestoneCode": "PROJ-001-MS-01",
        "title": "Design Phase",
        "description": "Complete engineering designs",
        "plannedDate": "2025-02-15",
        "actualCompletionDate": "2025-02-10",
        "status": "COMPLETED",
        "completionPercentage": 100.00,
        "budgetAllocated": 50000.00,
        "actualCost": 48000.00,
        "responsibleUser": {
          "id": 5,
          "firstName": "Hassan",
          "lastName": "Benali"
        },
        "sequenceOrder": 1,
        "dependsOnMilestone": null
      },
      {
        "id": 2,
        "milestoneCode": "PROJ-001-MS-02",
        "title": "Foundation Work",
        "description": "Complete foundation and groundwork",
        "plannedDate": "2025-04-01",
        "actualCompletionDate": null,
        "status": "IN_PROGRESS",
        "completionPercentage": 75.00,
        "budgetAllocated": 150000.00,
        "actualCost": 120000.00,
        "responsibleUser": {
          "id": 6,
          "firstName": "Amina",
          "lastName": "Idrissi"
        },
        "sequenceOrder": 2,
        "dependsOnMilestone": {
          "id": 1,
          "title": "Design Phase"
        }
      }
    ]
  }
}
```

---

#### POST `/projects/:id/milestones`

Create milestone for project.

**Required Permission:** `project_update`

**Request Body:**
```json
{
  "title": "System Testing Phase",
  "description": "Complete system testing and validation",
  "plannedDate": "2025-06-15",
  "budgetAllocated": 30000.00,
  "responsibleUserId": 5,
  "sequenceOrder": 5,
  "dependsOnMilestoneId": 4,
  "deliverables": ["Test reports", "Quality assurance documentation"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "milestoneCode": "PROJ-001-MS-05",
    ... (full milestone object)
  }
}
```

---

#### GET `/projects/:id/progress`

Get project progress metrics and analytics.

**Required Permission:** `project_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projectId": 1,
    "projectCode": "PROJ-2025-001",
    "completionPercentage": 65.50,
    "timelineStatus": "ON_TRACK",
    "budgetStatus": "AT_RISK",
    "overallHealth": "YELLOW",
    "daysElapsed": 136,
    "daysRemainingPlanned": 45,
    "daysRemainingActual": 45,
    "completedMilestones": 3,
    "totalMilestones": 6,
    "milestoneCompletionRate": 50.00,
    "budgetUtilization": 80.00,
    "criticalIssues": [
      {
        "type": "BUDGET_ALERT",
        "severity": "HIGH",
        "message": "Personnel budget at 90% utilization",
        "category": "PERSONNEL"
      }
    ],
    "risks": [
      {
        "description": "Weather delays possible in May",
        "likelihood": "MEDIUM",
        "impact": "MEDIUM"
      }
    ]
  }
}
```

---

#### POST `/projects/:id/team-members`

Assign user to project team.

**Required Permission:** `project_update`

**Request Body:**
```json
{
  "userId": 7,
  "allocationPercentage": 75.00,
  "startDate": "2025-02-01",
  "endDate": "2025-06-30",
  "roleOnProject": "Lead Engineer",
  "hourlyRate": 150.00
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "projectId": 1,
    "user": {
      "id": 7,
      "firstName": "Youssef",
      "lastName": "Tazi"
    },
    "allocationPercentage": 75.00,
    "roleOnProject": "Lead Engineer",
    "allocationStatus": "ACTIVE"
  }
}
```

---

#### GET `/projects/:id/documents`

Get all documents for project.

**Required Permission:** `project_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "documentCode": "DOC-PROJ-001-001",
      "documentName": "Project Charter",
      "documentType": "SPECIFICATION",
      "fileSize": 2457600,
      "fileType": "pdf",
      "version": 2,
      "uploadedAt": "2025-01-15T10:00:00Z",
      "uploadedBy": {
        "id": 1,
        "firstName": "Ahmed",
        "lastName": "Ali"
      },
      "isConfidential": false,
      "accessLevel": "INTERNAL"
    }
  ]
}
```

---

### 3. Milestones Module

#### GET `/milestones`

List milestones with filtering.

**Query Parameters:**
```
projectId: 1
status: NOT_STARTED,IN_PROGRESS,COMPLETED
responsibleUserId: 5
overdue: true
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "milestones": [ ... ],
    "pagination": { ... }
  }
}
```

---

#### GET `/milestones/:id`

Get milestone details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... milestone details ... }
}
```

---

#### PUT `/milestones/:id`

Update milestone.

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... updated milestone ... }
}
```

---

#### PUT `/milestones/:id/status`

Update milestone status and completion.

**Request Body:**
```json
{
  "status": "COMPLETED",
  "actualCompletionDate": "2025-03-15",
  "completionPercentage": 100.00,
  "actualCost": 148000.00,
  "notes": "Milestone completed successfully"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 4. Equipment Module

#### GET `/equipment`

List all equipment with filtering.

**Query Parameters:**
```
status: AVAILABLE,IN_USE,MAINTENANCE
equipmentType: VEHICLE,MACHINERY,TOOLS
location: Tétouan Yard
search: excavator
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "equipment": [
      {
        "id": 1,
        "equipmentCode": "EQP-2025-0001",
        "equipmentName": "Excavator CAT 320",
        "equipmentType": "MACHINERY",
        "serialNumber": "SN-CAT-12345",
        "manufacturer": "Caterpillar",
        "model": "320 GC",
        "purchaseDate": "2020-05-15",
        "purchasePrice": 150000.00,
        "status": "IN_USE",
        "conditionStatus": "GOOD",
        "location": "Tétouan Yard",
        "currentlyAssignedToProject": {
          "id": 1,
          "projectCode": "PROJ-2025-001",
          "projectName": "Infrastructure Project A"
        },
        "assignmentDate": "2025-01-15",
        "nextMaintenanceDate": "2025-12-15",
        "currentBookValue": 82500.00,
        "usefulLifeYears": 10,
        "operatingHours": 3250.50
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST `/equipment`

Add new equipment to inventory.

**Required Permission:** `equipment_create`

**Request Body:**
```json
{
  "equipmentName": "Excavator CAT 320",
  "equipmentType": "MACHINERY",
  "category": "Heavy Equipment",
  "serialNumber": "SN-CAT-12345",
  "manufacturer": "Caterpillar",
  "model": "320 GC",
  "purchaseDate": "2020-05-15",
  "purchasePrice": 150000.00,
  "purchaseVendorId": 5,
  "warrantyExpiry": "2023-05-15",
  "location": "Tétouan Yard",
  "usefulLifeYears": 10,
  "salvageValue": 15000.00,
  "depreciationMethod": "STRAIGHT_LINE",
  "maintenanceSchedule": "QUARTERLY",
  "fuelType": "Diesel"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 50,
    "equipmentCode": "EQP-2025-0050",
    ... (full equipment object)
  }
}
```

---

#### GET `/equipment/:id`

Get detailed equipment information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "equipmentCode": "EQP-2025-0001",
    ... (full equipment details)
    "maintenanceHistory": [
      {
        "id": 5,
        "maintenanceDate": "2024-10-15",
        "maintenanceType": "PREVENTIVE",
        "description": "Regular service and oil change",
        "cost": 2500.00,
        "completed": true,
        "completionDate": "2024-10-15"
      }
    ],
    "allocationHistory": [
      {
        "id": 8,
        "project": {
          "id": 2,
          "projectCode": "PROJ-2024-015"
        },
        "allocationDate": "2024-03-01",
        "actualReturnDate": "2024-08-15",
        "status": "RETURNED",
        "usageHours": 450.00
      }
    ]
  }
}
```

---

#### POST `/equipment/:id/allocate`

Allocate equipment to project.

**Required Permission:** `equipment_allocate`

**Request Body:**
```json
{
  "projectId": 1,
  "plannedReturnDate": "2025-06-30",
  "notes": "Required for foundation excavation work"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "allocationId": 25,
    "equipmentId": 1,
    "projectId": 1,
    "allocationDate": "2025-11-17T16:00:00Z",
    "status": "ACTIVE"
  }
}
```

---

#### POST `/equipment/:id/return`

Return allocated equipment.

**Required Permission:** `equipment_update`

**Request Body:**
```json
{
  "actualReturnDate": "2025-06-15",
  "returnCondition": "GOOD",
  "usageHours": 450.50,
  "usageKilometers": 0.00,
  "notes": "Equipment returned in good condition, no damage"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "allocationId": 25,
    "status": "RETURNED",
    "returnedAt": "2025-06-15T14:30:00Z"
  }
}
```

---

#### POST `/equipment/:id/maintenance`

Record maintenance activity.

**Required Permission:** `equipment_update`

**Request Body:**
```json
{
  "maintenanceType": "PREVENTIVE",
  "maintenanceDate": "2025-11-17",
  "description": "Regular service: oil change, filter replacement, inspection",
  "cost": 2800.00,
  "vendorId": 3,
  "technicianName": "Mohammed Hassan",
  "estimatedHours": 4.00,
  "actualHours": 3.50,
  "conditionBefore": "GOOD",
  "conditionAfter": "EXCELLENT",
  "sparePartsUsed": "Oil filter, Air filter, Engine oil (20L)",
  "completed": true,
  "completionDate": "2025-11-17",
  "nextMaintenanceDate": "2026-02-17"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "equipmentId": 1,
    ... (full maintenance record)
  }
}
```

---

### 5. Budget Module

#### GET `/budgets`

List budget allocations with filtering.

**Query Parameters:**
```
projectId: 1
category: PERSONNEL,EQUIPMENT
status: ON_TRACK,AT_RISK,EXCEEDED
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "budgets": [ ... ],
    "pagination": { ... }
  }
}
```

---

#### POST `/budgets`

Create budget allocation.

**Required Permission:** `budget_create`

**Request Body:**
```json
{
  "projectId": 1,
  "category": "MATERIALS",
  "allocatedAmount": 125000.00,
  "alertThresholdPercent": 85,
  "notes": "Budget for construction materials"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### GET `/budgets/:id/transactions`

Get spending transactions for budget.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "budgetId": 1,
    "transactions": [
      {
        "id": 15,
        "transactionType": "EXPENSE",
        "amount": 15000.00,
        "description": "Employee salaries - November 2025",
        "referenceNumber": "PAY-2025-11",
        "transactionDate": "2025-11-01",
        "approvedBy": {
          "id": 3,
          "firstName": "Mohammed",
          "lastName": "Alami"
        },
        "createdAt": "2025-11-01T09:00:00Z"
      }
    ]
  }
}
```

---

#### POST `/budgets/:id/transactions`

Record budget transaction.

**Required Permission:** `budget_update`

**Request Body:**
```json
{
  "transactionType": "EXPENSE",
  "amount": 18500.00,
  "description": "Material purchase from vendor XYZ",
  "referenceNumber": "INV-2025-1045",
  "transactionDate": "2025-11-17",
  "referenceDocumentId": 25
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 78,
    "budgetAllocationId": 1,
    ... (full transaction)
  }
}
```

---

### 6. Purchase Orders Module

#### GET `/purchase-orders`

List purchase orders with filtering.

**Query Parameters:**
```
status: DRAFT,SUBMITTED,APPROVED,ORDERED,RECEIVED
vendorId: 5
projectId: 1
approvalStatus: PENDING,APPROVED,REJECTED
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "purchaseOrders": [
      {
        "id": 10,
        "poNumber": "PO-2025-00010",
        "vendor": {
          "id": 5,
          "vendorName": "ABC Construction Supplies"
        },
        "project": {
          "id": 1,
          "projectCode": "PROJ-2025-001"
        },
        "poDate": "2025-11-10",
        "poAmount": 75000.00,
        "poStatus": "APPROVED",
        "approvalStatus": "APPROVED",
        "itemsCount": 5,
        "createdBy": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST `/purchase-orders`

Create purchase order.

**Required Permission:** `purchase_create`

**Request Body:**
```json
{
  "vendorId": 5,
  "projectId": 1,
  "requiredDeliveryDate": "2025-12-31",
  "description": "Purchase of construction materials",
  "deliveryLocation": "Project Site - Tétouan",
  "deliveryContact": "Hassan Benali - +212-6-12-34-56-78",
  "items": [
    {
      "description": "Portland Cement 50kg bags",
      "quantity": 500,
      "unit": "Bag",
      "unitPrice": 75.00
    },
    {
      "description": "Steel reinforcement bars 12mm",
      "quantity": 2000,
      "unit": "Meter",
      "unitPrice": 25.00
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "poNumber": "PO-2025-00025",
    "vendorId": 5,
    "projectId": 1,
    "poAmount": 87500.00,
    "poStatus": "DRAFT",
    "approvalStatus": "PENDING",
    "itemsCount": 2,
    "items": [
      {
        "id": 50,
        "itemNumber": 1,
        "description": "Portland Cement 50kg bags",
        "quantity": 500,
        "unit": "Bag",
        "unitPrice": 75.00,
        "totalPrice": 37500.00
      },
      {
        "id": 51,
        "itemNumber": 2,
        "description": "Steel reinforcement bars 12mm",
        "quantity": 2000,
        "unit": "Meter",
        "unitPrice": 25.00,
        "totalPrice": 50000.00
      }
    ],
    "createdAt": "2025-11-17T16:00:00Z"
  }
}
```

---

#### GET `/purchase-orders/:id`

Get purchase order details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "poNumber": "PO-2025-00025",
    ... (full PO details with items)
  }
}
```

---

#### POST `/purchase-orders/:id/submit`

Submit PO for approval.

**Required Permission:** `purchase_create`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Purchase order submitted for approval",
  "data": {
    "poStatus": "SUBMITTED",
    "approvalStatus": "PENDING"
  }
}
```

---

#### POST `/purchase-orders/:id/receive`

Receive/accept goods from PO.

**Required Permission:** `purchase_update`

**Request Body:**
```json
{
  "actualDeliveryDate": "2025-12-20",
  "items": [
    {
      "itemId": 50,
      "quantityReceived": 500,
      "qualityStatus": "ACCEPTED"
    },
    {
      "itemId": 51,
      "quantityReceived": 1950,
      "qualityStatus": "PARTIAL"
    }
  ],
  "notes": "50 meters of steel bars damaged in transport"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "poStatus": "PARTIAL_RECEIVED",
    "receivedItems": 2,
    "totalItems": 2
  }
}
```

---

### 7. Approvals Module

#### GET `/approvals`

List pending approvals for current user.

**Query Parameters:**
```
status: PENDING,APPROVED,REJECTED
requestType: PROJECT,BUDGET,PURCHASE_ORDER
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "approvals": [
      {
        "id": 15,
        "approvalCode": "APR-2025-015",
        "requestType": "PURCHASE_ORDER",
        "requestId": 25,
        "status": "PENDING",
        "approvalLevel": 1,
        "totalApprovalLevels": 2,
        "submittedDate": "2025-11-17T10:00:00Z",
        "submittedBy": {
          "id": 5,
          "firstName": "Hassan",
          "lastName": "Benali"
        },
        "details": {
          "poNumber": "PO-2025-00025",
          "vendor": "ABC Construction Supplies",
          "amount": 87500.00,
          "description": "Purchase of construction materials"
        }
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST `/approvals/:id/approve`

Approve a request.

**Required Permission:** Based on request type (e.g., `purchase_approve`)

**Request Body:**
```json
{
  "comments": "Approved. Pricing is competitive and within budget.",
  "attachmentIds": [12, 13]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Request approved successfully",
  "data": {
    "approvalId": 15,
    "status": "APPROVED",
    "approvedAt": "2025-11-17T16:30:00Z",
    "nextApprovalLevel": 2,
    "requiresFurtherApproval": true
  }
}
```

---

#### POST `/approvals/:id/reject`

Reject a request.

**Required Permission:** Based on request type

**Request Body:**
```json
{
  "rejectionReason": "Budget already fully committed for this category",
  "comments": "Please revise the request and consider alternative vendors or timeline."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Request rejected",
  "data": {
    "approvalId": 15,
    "status": "REJECTED",
    "rejectedAt": "2025-11-17T16:30:00Z"
  }
}
```

---

### 8. Reports Module

#### GET `/reports/project-summary`

Overall project statistics and metrics.

**Required Permission:** `report_read`

**Query Parameters:**
```
dateFrom: 2025-01-01
dateTo: 2025-12-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalProjects": 45,
    "activeProjects": 12,
    "completedProjects": 28,
    "onHoldProjects": 2,
    "cancelledProjects": 3,
    "completionRate": 62.22,
    "onTimeCompletionRate": 85.71,
    "onBudgetCompletionRate": 78.57,
    "totalBudgetAllocated": 25000000.00,
    "totalBudgetSpent": 19500000.00,
    "budgetUtilization": 78.00,
    "averageProjectDuration": 185,
    "highRiskProjects": 3,
    "byStatus": {
      "PLANNING": 5,
      "IN_PROGRESS": 12,
      "ON_HOLD": 2,
      "COMPLETED": 28,
      "CANCELLED": 3
    },
    "byPriority": {
      "CRITICAL": 2,
      "HIGH": 8,
      "MEDIUM": 25,
      "LOW": 10
    },
    "monthlyTrends": [
      {
        "month": "2025-01",
        "projectsStarted": 3,
        "projectsCompleted": 2,
        "spending": 1250000.00
      }
    ]
  }
}
```

---

#### GET `/reports/budget-status`

Budget analysis and alerts.

**Required Permission:** `report_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalBudgetAllocated": 25000000.00,
    "totalBudgetSpent": 19500000.00,
    "totalBudgetCommitted": 2500000.00,
    "remainingBudget": 3000000.00,
    "utilizationPercent": 88.00,
    "overrunProjects": [
      {
        "projectId": 5,
        "projectCode": "PROJ-2025-005",
        "projectName": "Project X",
        "budgetAllocated": 300000.00,
        "budgetSpent": 325000.00,
        "overage": 25000.00,
        "overagePercent": 8.33
      }
    ],
    "atRiskProjects": [
      {
        "projectId": 1,
        "projectCode": "PROJ-2025-001",
        "utilizationPercent": 92.00,
        "remaining": 20000.00
      }
    ],
    "categoryBreakdown": [
      {
        "category": "PERSONNEL",
        "allocated": 10000000.00,
        "spent": 9500000.00,
        "committed": 300000.00,
        "utilizationPercent": 98.00
      },
      {
        "category": "EQUIPMENT",
        "allocated": 7000000.00,
        "spent": 5500000.00,
        "committed": 800000.00,
        "utilizationPercent": 90.00
      }
    ]
  }
}
```

---

#### GET `/reports/equipment-inventory`

Equipment status and utilization.

**Required Permission:** `report_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalEquipment": 150,
    "activeEquipment": 145,
    "retiredEquipment": 5,
    "byStatus": {
      "AVAILABLE": 45,
      "IN_USE": 85,
      "MAINTENANCE": 15,
      "RETIRED": 5
    },
    "utilizationRate": 66.67,
    "totalBookValue": 5500000.00,
    "byType": {
      "VEHICLE": 35,
      "MACHINERY": 45,
      "TOOLS": 50,
      "ELECTRONICS": 15,
      "FURNITURE": 5
    },
    "maintenanceDue": 8,
    "maintenanceOverdue": 2
  }
}
```

---

#### GET `/reports/export`

Export report as PDF or Excel.

**Required Permission:** `report_export`

**Query Parameters:**
```
reportType: project-summary, budget-status, equipment-inventory
format: pdf, xlsx
dateFrom: 2025-01-01
dateTo: 2025-12-31
```

**Response:** Binary file (application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

### 9. Users Module (Admin Only)

#### GET `/users`

List users with filtering.

**Required Permission:** `user_read`

**Query Parameters:**
```
isActive: true
roleId: 2
search: ahmed
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "ahmed.ali@tetouan.gov.ma",
        "username": "ahmed.ali",
        "firstName": "Ahmed",
        "lastName": "Ali",
        "phone": "+212-6-12-34-56-78",
        "department": "Engineering",
        "roles": ["PROJECT_MANAGER"],
        "isActive": true,
        "lastLogin": "2025-11-17T14:30:00Z",
        "createdAt": "2024-05-15T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST `/users`

Create new user.

**Required Permission:** `user_create`

**Request Body:**
```json
{
  "email": "fatima.hassan@tetouan.gov.ma",
  "username": "fatima.hassan",
  "firstName": "Fatima",
  "lastName": "Hassan",
  "phone": "+212-6-98-76-54-32",
  "department": "Finance",
  "employeeId": "EMP-2025-045",
  "roleIds": [4],
  "preferredLanguage": "fr"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "email": "fatima.hassan@tetouan.gov.ma",
    "temporaryPassword": "TempPass@2025",
    "mustChangePassword": true,
    ... (full user object)
  }
}
```

---

#### GET `/users/:id`

Get user details.

**Required Permission:** `user_read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... user details ... }
}
```

---

#### PUT `/users/:id`

Update user information.

**Required Permission:** `user_update`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... updated user ... }
}
```

---

#### DELETE `/users/:id`

Deactivate user.

**Required Permission:** `user_delete`

**Response (204 No Content)**

---

#### PUT `/users/:id/roles`

Update user roles.

**Required Permission:** `user_update`

**Request Body:**
```json
{
  "roleIds": [2, 5]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": 5,
    "roles": ["PROJECT_MANAGER", "SUPERVISOR"]
  }
}
```

---

### 10. Notifications Module

#### GET `/notifications`

Get user notifications.

**Query Parameters:**
```
unreadOnly: true
notificationType: BUDGET_ALERT,APPROVAL_NEEDED
limit: 50
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 45,
        "notificationType": "BUDGET_ALERT",
        "subject": "Budget Alert: PROJ-2025-001",
        "message": "Personnel budget for Project A has reached 90% utilization",
        "priority": "HIGH",
        "isRead": false,
        "actionUrl": "/projects/1/budget",
        "createdAt": "2025-11-17T15:00:00Z"
      }
    ],
    "unreadCount": 5,
    "pagination": { ... }
  }
}
```

---

#### PUT `/notifications/:id/read`

Mark notification as read.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "isRead": true,
    "readAt": "2025-11-17T16:00:00Z"
  }
}
```

---

#### DELETE `/notifications/:id`

Delete notification.

**Response (204 No Content)**

---

## ❌ Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ],
    "timestamp": "2025-11-17T16:00:00Z",
    "path": "/api/v1/projects",
    "requestId": "req-abc-123"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_INPUT` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | No permission for this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Business logic validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is already in use"
      },
      {
        "field": "estimatedBudget",
        "message": "Must be a positive number"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action",
    "details": [
      {
        "permission": "project_delete",
        "message": "Missing required permission"
      }
    ]
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with ID 999 not found"
  }
}
```

**429 Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 🛡️ Security

### Authentication Security

- **JWT Tokens**: HS256 algorithm with secure secret key
- **Access Token Expiry**: 1 hour
- **Refresh Token Expiry**: 30 days
- **Token Storage**: Refresh tokens stored in database for revocation
- **Password Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### CORS Configuration

```javascript
{
  origin: [
    'https://pmis.tetouan.gov.ma',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}
```

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Reports/Export | 10 requests | 1 hour |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700003700
```

### Input Validation

- All inputs validated using class-validator
- SQL injection prevention via parameterized queries (TypeORM/Prisma)
- XSS prevention via output encoding
- CSRF protection via tokens

### HTTPS Only

- Production environment requires HTTPS
- HTTP requests automatically redirected to HTTPS
- Strict-Transport-Security header enabled

---

## ⚡ Performance

### Caching Strategy

| Resource | Cache Duration | Cache Key |
|----------|----------------|------------|
| Projects List | 5 minutes | `projects:list:{params}` |
| Project Detail | 1 minute | `project:{id}` |
| Equipment List | 10 minutes | `equipment:list:{params}` |
| User Permissions | 1 hour | `user:{id}:permissions` |

**Cache Headers:**
```
Cache-Control: public, max-age=300
ETag: "abc123def456"
```

### Pagination

**Default Values:**
- Page: 1
- Limit: 20
- Max Limit: 100

**Pagination Metadata:**
```json
{
  "page": 1,
  "limit": 20,
  "total": 250,
  "pages": 13,
  "hasNext": true,
  "hasPrev": false
}
```

### Compression

- Response compression enabled (gzip)
- Minimum size: 1KB

### Database Query Optimization

- Indexes on all foreign keys
- Composite indexes on frequently queried combinations
- Query result caching
- Connection pooling

---

## 📏 Standards & Conventions

### HTTP Methods

- **GET**: Retrieve resources (read-only)
- **POST**: Create new resources
- **PUT**: Replace entire resource
- **PATCH**: Partially update resource
- **DELETE**: Remove resource

### HTTP Status Codes

- **200 OK**: Success
- **201 Created**: Resource created
- **204 No Content**: Success with no response body
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **422 Unprocessable Entity**: Validation failed
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### URL Naming Conventions

- Use plural nouns: `/projects` not `/project`
- Use kebab-case: `/purchase-orders` not `/purchaseOrders`
- Hierarchical relationships: `/projects/:id/milestones`
- Action verbs as endpoints: `/projects/:id/submit`

### JSON Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": { ... }
}
```

### Date/Time Format

- ISO 8601 format: `2025-11-17T16:00:00Z`
- UTC timezone in responses
- Accept local timezone in requests

### Decimal Precision

- Currency: 2 decimal places
- Percentages: 2 decimal places
- Quantities: 2 decimal places

---

## 📊 Logging & Monitoring

### Log Levels

- **ERROR**: Application errors, exceptions
- **WARN**: Deprecated endpoints, authorization failures
- **INFO**: Authentication events, important business operations
- **DEBUG**: Detailed request/response (development only)

### What to Log

✅ **DO Log:**
- Authentication attempts (success/failure)
- Authorization failures
- API errors and exceptions
- Slow queries (> 1 second)
- Business operations (approvals, budget changes)

❌ **DON'T Log:**
- Passwords or password hashes
- JWT tokens
- Personal information (unless required)
- Credit card or payment information

### Monitoring Metrics

- Response time by endpoint
- Error rate by endpoint
- Active users
- Database query performance
- Server resource usage (CPU, memory)
- Cache hit rate

---

## 📚 Additional Resources

- **Swagger/OpenAPI Documentation**: `/api/v1/docs`
- **API Health Check**: `/api/v1/health`
- **API Version**: `/api/v1/version`

---

**Prefecture of Tétouan - Division d'Équipement**  
**Ministry of Interior, Morocco**  
**API Version 1.0.0**
