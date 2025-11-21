/**
 * Application Constants
 * Central location for all application-wide constants
 */

module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  },

  // User Roles
  ROLES: {
    ADMIN: 'ADMIN',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    EQUIPMENT_OFFICER: 'EQUIPMENT_OFFICER',
    FINANCE_CONTROLLER: 'FINANCE_CONTROLLER',
    SUPERVISOR: 'SUPERVISOR',
    VIEWER: 'VIEWER',
  },

  // Project Status
  PROJECT_STATUS: {
    PLANNING: 'PLANNING',
    IN_PROGRESS: 'IN_PROGRESS',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },

  // Project Priority
  PROJECT_PRIORITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },

  // Equipment Status
  EQUIPMENT_STATUS: {
    AVAILABLE: 'AVAILABLE',
    IN_USE: 'IN_USE',
    MAINTENANCE: 'MAINTENANCE',
    RETIRED: 'RETIRED',
    DAMAGED: 'DAMAGED',
  },

  // Budget Status
  BUDGET_STATUS: {
    ON_TRACK: 'ON_TRACK',
    AT_RISK: 'AT_RISK',
    EXCEEDED: 'EXCEEDED',
  },

  // Approval Status
  APPROVAL_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    DELEGATED: 'DELEGATED',
  },

  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    SALT_ROUNDS: 10,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  },

  // Token Types
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    RESET: 'reset',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
  },

  // File Upload
  FILE_UPLOAD: {
    ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
    MAX_SIZE: 10485760, // 10MB
  },
};
