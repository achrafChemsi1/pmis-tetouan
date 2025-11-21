# PMIS Tétouan - Backend API

## Project Management Information System - REST API

**Prefecture of Tétouan - Division d'Équipement**  
**Ministry of Interior, Morocco**

---

## 📋 Overview

Production-ready Express.js REST API for the PMIS (Project Management Information System) serving the Equipment Division of Prefecture of Tétouan.

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MySQL 8.0 with mysql2/promise
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors
- **Logging**: winston
- **Documentation**: Swagger/OpenAPI

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- MySQL 8.0 or higher
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/achrafChemsi1/pmis-tetouan.git
cd pmis-tetouan/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Create database (if not already created)
mysql -u root -p < ../database/schema/03-complete-schema-21-tables.sql
mysql -u root -p < ../database/schema/04-complete-schema-part2.sql
mysql -u root -p < ../database/schema/05-views-and-seed-data.sql

# Start development server
npm run dev
```

### Environment Configuration

Edit `.env` file with your settings:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pmis_tetouan

JWT_SECRET=your_32_char_secret_key_here
JWT_REFRESH_SECRET=your_32_char_refresh_secret
```

### Start Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will start on: `http://localhost:3000`

---

## 📚 API Documentation

### Swagger UI

Access interactive API documentation:

```
http://localhost:3000/api/docs
```

### API Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```bash
curl http://localhost:3000/health
```

---

## 🔐 Authentication

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@prefecture-tetouan.ma",
    "password": "Admin@2025"
  }'
```

### Using JWT Token

```bash
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Database queries
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main entry point
├── tests/               # Test files
├── logs/                # Log files (generated)
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md            # This file
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 🛠️ Development

### Scripts

```bash
npm start        # Start production server
npm run dev      # Start development server with nodemon
npm test         # Run tests
npm run seed     # Seed database with sample data
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

---

## 🔒 Security Features

- ✅ JWT authentication on all endpoints
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ Rate limiting (auth: 5/min, API: 100/min)
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection
- ✅ Account lockout after failed login attempts

---

## 📊 Database

Database schema documentation: `../database/schema/COMPLETE-SCHEMA-README.md`

- 21 normalized tables (3NF)
- 4 business intelligence views
- 6 system roles with RBAC
- 28 fine-grained permissions

---

## 📝 License

MIT License - See LICENSE file

---

## 🤝 Support

- **GitHub Issues**: [Report bugs](https://github.com/achrafChemsi1/pmis-tetouan/issues)
- **Email**: contact@prefecture-tetouan.ma

---

**Developed with ❤️ for the Prefecture of Tétouan**
