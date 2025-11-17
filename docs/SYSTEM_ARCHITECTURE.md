# PMIS Tétouan - System Architecture Document

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Performance & Scalability](#performance--scalability)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Risk Assessment](#risk-assessment)

## Executive Summary

PMIS Tétouan is an enterprise-grade Project Management Information System designed for the Equipment Division of the Prefecture of Tétouan, Ministry of Interior, Morocco. The system manages infrastructure projects, equipment inventory, procurement, budgets, and regulatory compliance.

**Key Metrics:**
- **Users**: 100+ concurrent (initial), scalable to 1000+
- **Uptime**: 99.5% SLA
- **Performance**: < 2s page load, < 500ms API response
- **Security**: AES-256 encryption, RBAC, full audit trail
- **Compliance**: Moroccan Decree No. 2-24-921

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   Web App  │  │   Mobile   │  │   Admin    │  │
│  │   (React)  │  │ Responsive│  │   Portal   │  │
│  │  French/EN │  │  (Future)  │  │           │  │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                                │
├────────────────────────────┴────────────────────────────┤
│                   API GATEWAY LAYER                          │
├────────────────────────────┬────────────────────────────┤
│  ┌─────────────────────────┴─────────────────────────┐  │
│  │     NGINX / API Gateway (Kong/Traefik)      │  │
│  │  • Rate Limiting  • SSL/TLS Termination       │  │
│  │  • Load Balancing • Request Routing           │  │
│  └─────────────────────────┬─────────────────────────┘  │
│                            │                                │
├────────────────────────────┴────────────────────────────┤
│                  APPLICATION LAYER                           │
├────────────────────────────┬────────────────────────────┤
│  ┌─────────────────────────┴─────────────────────────┐  │
│  │    BACKEND API (Node.js/NestJS)          │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │     MODULAR MONOLITH ARCHITECTURE     │  │  │
│  │  │  • Authentication & Authorization    │  │  │
│  │  │  • User Management (IAM)             │  │  │
│  │  │  • Project Management                │  │  │
│  │  │  • Budget Management                 │  │  │
│  │  │  • Equipment Inventory               │  │  │
│  │  │  • Procurement & Vendor Mgmt         │  │  │
│  │  │  • Resource Allocation               │  │  │
│  │  │  • Workflow & Approvals Engine       │  │  │
│  │  │  • Document Management               │  │  │
│  │  │  • Notifications Service             │  │  │
│  │  │  • Reporting & Analytics             │  │  │
│  │  │  • Audit Trail & Compliance          │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └──────────────────────────┬───────────────────────┘  │
│                            │                                │
├────────────────────────────┴────────────────────────────┤
│                      DATA LAYER                              │
├────────────────────────────┬────────────────────────────┤
│  ┌─────────────────────────┴─────────────────────────┐  │
│  │     PostgreSQL 16+ (Primary Database)      │  │
│  │  • Multi-schema architecture              │  │
│  │  • Row-level security (RLS)               │  │
│  │  • Full-text search capabilities          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │     Redis Cache (Session & Performance)     │  │
│  │  • Session storage  • Query result caching  │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  File Storage (MinIO / S3-Compatible)     │  │
│  │  • Document repository  • Equipment photos  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

See full technology stack justification in the main architecture document.

### Frontend
- React 18+ with TypeScript
- Ant Design (UI components)
- React Query (state management)
- i18next (French/English)

### Backend
- Node.js 20 LTS
- NestJS framework
- TypeORM/Prisma
- JWT authentication

### Database
- MySQL 8.0+ (ACID compliant)
- Redis 7+ (caching)
- MinIO (object storage)

### Infrastructure
- Docker + Kubernetes
- NGINX reverse proxy
- Prometheus + Grafana
- ELK Stack (logging)

## Database Architecture

### Database Statistics
- **21 tables** (3NF normalized)
- **120+ indexes**
- **6 performance views**
- **UTF8MB4** character set

### Key Tables

1. **User Management**: users, roles, permissions
2. **Projects**: projects, milestones
3. **Budget**: budget_allocations, budget_transactions
4. **Equipment**: equipment, equipment_maintenance, equipment_allocation
5. **Procurement**: vendors, purchase_orders, purchase_order_items
6. **System**: audit_log, notifications, system_settings

See `database/schema/` for complete schema.

## Security Architecture

### Authentication & Authorization
- **JWT tokens** (RS256 algorithm)
- **RBAC** with 6 predefined roles
- **Session timeout**: 30 minutes
- **Password policy**: 12+ chars, complexity requirements

### Data Security
- **Encryption at rest**: AES-256
- **Encryption in transit**: TLS 1.3
- **Password hashing**: bcrypt (cost factor 12)
- **Database security**: Row-level security, parameterized queries

### Compliance
- **Moroccan Decree No. 2-24-921** compliance
- **Data sovereignty**: All data stored in Morocco
- **Audit trail**: Complete logging of all operations
- **GDPR-ready**: Data export, deletion capabilities

## Deployment Architecture

### Environments

1. **Development**: Local Docker Compose
2. **Staging**: Kubernetes (2 pods)
3. **Production**: Kubernetes (3+ pods, auto-scaling)

### Kubernetes Configuration

```yaml
Production Deployment:
- API Pods: 3 (auto-scale to 10)
- Database: MySQL primary + 2 read replicas
- Cache: Redis cluster (3 nodes)
- Storage: MinIO distributed
```

### High Availability

- **Load balancing**: NGINX/Traefik
- **Auto-scaling**: HPA (CPU 70%, Memory 80%)
- **Health checks**: Liveness + Readiness probes
- **Rolling updates**: Zero-downtime deployments

## Performance & Scalability

### Performance Targets

| Metric | Target | Current |
|--------|--------|------|
| Page Load Time | < 2s | TBD |
| API Response | < 500ms (p95) | TBD |
| Database Query | < 100ms (p95) | TBD |
| Concurrent Users | 100+ | TBD |
| Uptime | 99.5% | TBD |

### Scalability Strategy

**Horizontal Scaling:**
- API: 1 pod → 10 pods (auto-scale)
- Database: Primary + read replicas
- Cache: Redis cluster

**Vertical Scaling:**
- CPU: 2 cores → 8 cores
- Memory: 4GB → 32GB

**Optimization Techniques:**
- Database indexing
- Query result caching (Redis)
- CDN for static assets
- Lazy loading
- Code splitting

## Implementation Roadmap

### Phase 1: MVP (Months 0-3)
- Authentication & user management
- Project CRUD operations
- Basic budget management
- Equipment inventory
- Dashboard & basic reports

### Phase 2: Advanced Features (Months 3-6)
- Procurement module
- Milestone management
- Document management
- Email notifications
- Advanced reporting

### Phase 3: Optimization (Months 6-12)
- Mobile responsive design
- Gantt charts
- Risk management
- AI analytics
- Digital signatures

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Database performance | Medium | High | Indexing, caching, read replicas |
| Security breach | Low | Critical | Regular audits, pen testing |
| Scalability issues | Medium | High | Kubernetes auto-scaling |

### Organizational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| User adoption resistance | Medium | High | Training, change management |
| Scope creep | High | Medium | Strict change control |
| Budget constraints | Low | Medium | Phased development |

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Next Review**: 2025-12-17
