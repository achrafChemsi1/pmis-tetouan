/**
 * Application Constants
 * Define system-wide constants and enums
 */

module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 'ADMIN',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    EQUIPMENT_OFFICER: 'EQUIPMENT_OFFICER',
    FINANCE_CONTROLLER: 'FINANCE_CONTROLLER',
    SUPERVISOR: 'SUPERVISOR',
    VIEWER: 'VIEWER'
  },
  
  // Project Status
  PROJECT_STATUS: {
    PLANNING: 'PLANNING',
    IN_PROGRESS: 'IN_PROGRESS',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  },
  
  // Project Priority
  PROJECT_PRIORITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },
  
  // Project Types
  PROJECT_TYPE: {
    CONSTRUCTION: 'CONSTRUCTION',
    RENOVATION: 'RENOVATION',
    INFRASTRUCTURE: 'INFRASTRUCTURE',
    EQUIPMENT: 'EQUIPMENT',
    OTHER: 'OTHER'
  },
  
  // Equipment Status
  EQUIPMENT_STATUS: {
    AVAILABLE: 'AVAILABLE',
    IN_USE: 'IN_USE',
    MAINTENANCE: 'MAINTENANCE',
    RETIRED: 'RETIRED',
    DAMAGED: 'DAMAGED'
  },
  
  // Equipment Types
  EQUIPMENT_TYPE: {
    VEHICLE: 'VEHICLE',
    MACHINERY: 'MACHINERY',
    TOOLS: 'TOOLS',
    ELECTRONICS: 'ELECTRONICS',
    FURNITURE: 'FURNITURE',
    OTHER: 'OTHER'
  },
  
  // Budget Categories
  BUDGET_CATEGORY: {
    PERSONNEL: 'PERSONNEL',
    EQUIPMENT: 'EQUIPMENT',
    MATERIALS: 'MATERIALS',
    CONTRACTORS: 'CONTRACTORS',
    OTHER: 'OTHER'
  },
  
  // Budget Status
  BUDGET_STATUS: {
    ON_TRACK: 'ON_TRACK',
    AT_RISK: 'AT_RISK',
    EXCEEDED: 'EXCEEDED'
  },
  
  // Approval Status
  APPROVAL_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    DELEGATED: 'DELEGATED'
  },
  
  // Purchase Order Status
  PO_STATUS: {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    ORDERED: 'ORDERED',
    PARTIAL_RECEIVED: 'PARTIAL_RECEIVED',
    RECEIVED: 'RECEIVED',
    INVOICED: 'INVOICED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED'
  },
  
  // Milestone Status
  MILESTONE_STATUS: {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    DELAYED: 'DELAYED',
    CANCELLED: 'CANCELLED'
  },
  
  // Languages
  LANGUAGES: {
    FRENCH: 'fr',
    ENGLISH: 'en',
    ARABIC: 'ar'
  },
  
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },
  
  // Error Codes
  ERROR_CODES: {
    INVALID_INPUT: 'INVALID_INPUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY'
  },
  
  // Permissions
  PERMISSIONS: {
    // Project permissions
    PROJECT_CREATE: 'project_create',
    PROJECT_READ: 'project_read',
    PROJECT_UPDATE: 'project_update',
    PROJECT_DELETE: 'project_delete',
    PROJECT_APPROVE: 'project_approve',
    
    // Budget permissions
    BUDGET_CREATE: 'budget_create',
    BUDGET_READ: 'budget_read',
    BUDGET_UPDATE: 'budget_update',
    BUDGET_APPROVE: 'budget_approve',
    
    // Equipment permissions
    EQUIPMENT_CREATE: 'equipment_create',
    EQUIPMENT_READ: 'equipment_read',
    EQUIPMENT_UPDATE: 'equipment_update',
    EQUIPMENT_DELETE: 'equipment_delete',
    EQUIPMENT_ALLOCATE: 'equipment_allocate',
    
    // Purchase permissions
    PURCHASE_CREATE: 'purchase_create',
    PURCHASE_READ: 'purchase_read',
    PURCHASE_UPDATE: 'purchase_update',
    PURCHASE_APPROVE: 'purchase_approve',
    
    // User permissions
    USER_CREATE: 'user_create',
    USER_READ: 'user_read',
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',
    
    // Report permissions
    REPORT_READ: 'report_read',
    REPORT_EXPORT: 'report_export',
    
    // Audit permissions
    AUDIT_READ: 'audit_read',
    
    // Settings permissions
    SETTINGS_UPDATE: 'settings_update'
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  
  // Cache TTL (in seconds)
  CACHE_TTL: {
    PROJECTS_LIST: 300,      // 5 minutes
    PROJECT_DETAIL: 60,      // 1 minute
    EQUIPMENT_LIST: 600,     // 10 minutes
    USER_PERMISSIONS: 3600   // 1 hour
  }
};

// Validate critical configuration in production
if (config.NODE_ENV === 'production') {
  if (!config.DB_PASSWORD) {
    throw new Error('DB_PASSWORD must be set in production');
  }
  
  if (config.JWT_SECRET.includes('development') || config.JWT_SECRET.includes('change')) {
    throw new Error('JWT_SECRET must be changed in production');
  }
}

module.exports = config;
