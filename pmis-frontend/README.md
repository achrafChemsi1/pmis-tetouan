# PMIS System Integration & Deployment Guide

This document provides complete instructions for integrating your React frontend with the Node.js backend, along with checklists for live deployment, testing, and post-deployment best practices.

## INTEGRATION CHECKLIST

### 1. API Configuration
- Ensure the frontend `.env` (`REACT_APP_API_URL`) points to the backend API base URL
- Backend CORS is correctly configured
- Protocol consistency (HTTPS in production, HTTP for development)
- Correct port numbers for both frontend/backend
- Use separate env files for dev, staging, and production (never commit secrets!)

### 2. Authentication Flow
- Frontend calls `/auth/login` with credentials
- Backend returns access + refresh tokens
- Frontend securely stores tokens in memory (Redux)
- Frontend injects token in the `Authorization` header on all API calls
- Backend verifies token on every request
- Frontend auto-refreshes tokens before expiry
- Logout endpoint invalidates the refresh token on server

### 3. Data Format Consistency
- Frontend sends JSON exactly matching backend expectations
- Consistent use of ISO 8601 for all date-times
- Money and decimals: always use string/numeric values with proper precision
- Enum and status fields match exactly between frontend and backend

### 4. Error Handling
- All API errors are caught and reported in the frontend
- Display user-friendly error messages
- Detailed errors/logs in development
- 401 errors trigger token refresh and/or login
- 403 errors show correct access denial message
- Handle network errors or 5xx as global error state

### 5. Testing Endpoints
- Use a Postman collection to test API endpoints independently
- Test Auth, CRUD, Filter, Pagination, Error, and Authorization flows
- Test with invalid and edge-case inputs

### 6. Integration Test Scenarios
- User can login and see dashboard
- User creates a project that appears in the list
- User updates and deletes a project, and list updates
- Allocate equipment and verify assignment in project detail
- Approve budget and check reflected status
- Submit invalid data and verify validation catches and shows error

### 7. Environment Variables
- Frontend: `REACT_APP_API_URL=http://localhost:3000/api` (update port and URL as needed)
- Backend: `DB_HOST`, `JWT_SECRET`, `CORS_ORIGIN`, etc.
- Set appropriately for dev/staging/prod
- Never commit secrets to source control

### 8. CORS Testing
- Run frontend and backend on different ports in development and verify requests
- Credentials and headers are allowed (cookies, Authorization header as needed)
- Preflight (`OPTIONS`) requests succeed

---

## DEPLOYMENT CHECKLIST

**Before going live:**
- All unit and integration tests pass (backend and frontend)
- Manual regression and smoke tests completed
- Performance/load tested
- Full security scan/audit completed
- Peer code reviews finalized
- Database backup and restore procedure tested
- Rollback/deploy procedures documented and tested
- Health check endpoints return 200 OK
- Production monitoring and logging in place
- Documentation is up-to-date

---

## POST-DEPLOYMENT
- Track and monitor all error logs
- Monitor application/APM metrics (latency, error rate, throughput, health checks)
- Manually run critical user flow (login, CRUD, approval, reporting)
- Check data integrity and run sanity queries on DB
- Ensure email/notification delivery
- Verify scheduled/recurring jobs/processes
- Be ready to rollback release if critical issues arise

---

For full example environment files, see `.env.example` in each app folder.
For API documentation and more detailed workflow examples, see the Swagger docs and Postman collection.
