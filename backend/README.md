# Realtime Metrics Dashboard — Backend Service

## 1. Project Overview
The **Interactive Dashboard with Real-Time Updates and API Request Validation** is a full-stack web application designed to monitor live operational metrics across sales, traffic, system performance, and revenue streams. The `/backend` service powers this dashboard by delivering a robust, resilient Node.js and Express REST API that handles data persistence, real-time filtering, strict input validation, and standardized error responses.

---

## 2. My Role & Ownership (Backend Engineering — Suwetha E)
> **Role**: Senior Backend Engineer  
> **Ownership**: Independently designed, implemented, and verified the entire Node.js + Express backend architecture and REST API services from scratch.

### Key Technical Responsibilities & Deliverables:
- **Project Architecture**: Structured a clean, scalable modular architecture separating concerns across `routes/`, `controllers/`, `validators/`, and `middlewares/` for enterprise-level maintainability.
- **REST API Endpoint Design**: Built comprehensive CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`) with dynamic category query filtering (`/api/v1/dashboard/metrics`) and realistic in-memory state management.
- **Request Validation**: Implemented strict schema and route-parameter validation chains using `express-validator` to enforce rules on title length (3–50 chars), numeric values, allowed categories (`SALES`, `TRAFFIC`, `SYSTEM`, `REVENUE`), statuses (`ACTIVE`, `WARNING`, `CRITICAL`), and positive integer IDs.
- **Centralized Error Handling**: Created custom validation and global error middlewares (`AppError`, `validate`, `errorHandler`) that intercept failures and return consistent, standardized JSON responses (`400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
- **Frontend Integration Readiness**: Configured CORS middleware and pre-seeded realistic production metrics so frontend applications (e.g., Vue.js) can connect and consume live data immediately without requiring external database provisioning.

---

## 3. Folder Structure

```
backend/
├── package.json                         # Project dependencies, metadata, and scripts (start, dev)
├── server.js                            # Server entry point, port binding (5000), and process lifecycle handlers
├── README.md                            # Complete engineering documentation and live demo guide
└── src/
    ├── app.js                           # Express application setup, CORS, JSON parsing, and middleware pipeline
    ├── controllers/
    │   └── dashboard.controller.js      # Business logic, CRUD operations, and in-memory metrics store
    ├── middlewares/
    │   ├── error.middleware.js          # AppError class and centralized global error handling middleware
    │   └── validate.middleware.js       # express-validator failure interceptor formatting field-level errors
    ├── routes/
    │   └── dashboard.routes.js          # REST route declarations mapping paths to validators and controllers
    └── validators/
        └── dashboard.validator.js       # express-validator schemas for bodies, query parameters, and route IDs
```

- **`src/controllers/`**: Executes business logic and manipulates in-memory dashboard metric records.
- **`src/middlewares/`**: Intercepts requests for input validation and formats centralized application errors.
- **`src/routes/`**: Defines RESTful HTTP paths and binds them to their respective validation chains and controllers.
- **`src/validators/`**: Contains declarative validation rules and schema constraints for incoming requests.

---

## 4. How to Run Locally

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### Step-by-Step Instructions

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   - **Development Mode (with auto-reload via nodemon)**:
     ```bash
     npm run dev
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```

The backend will start and listen on port `5000`:
```
http://localhost:5000
Base Endpoint: http://localhost:5000/api/v1/dashboard/metrics
```

---

## 5. API Endpoints & Live Demo Examples

### API Endpoints Summary

| Method | Endpoint | Purpose | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Verify API health and uptime | `200 OK` |
| `GET` | `/api/v1/dashboard/metrics` | Retrieve all metrics (supports `?category=` filter) | `200 OK`, `400 Bad Request` |
| `GET` | `/api/v1/dashboard/metrics/:id` | Retrieve a single metric by its ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/api/v1/dashboard/metrics` | Create a new real-time dashboard metric | `201 Created`, `400 Bad Request` |
| `PUT` | `/api/v1/dashboard/metrics/:id` | Update an existing metric and refresh timestamp | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/v1/dashboard/metrics/:id` | Delete a metric from the dashboard | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

### Request & Response Examples

#### 1. Fetching & Filtering Metrics (`200 OK`)
**Request**:
```http
GET /api/v1/dashboard/metrics?category=TRAFFIC HTTP/1.1
Host: localhost:5000
```
**Response** (`200 OK`):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "title": "Active Platform Users",
      "value": 12450,
      "category": "TRAFFIC",
      "status": "ACTIVE",
      "updatedAt": "2026-03-30T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Creating a Valid Metric (`201 Created`)
**Request**:
```http
POST /api/v1/dashboard/metrics HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "title": "Checkout Conversion Rate",
  "value": 3.42,
  "category": "SALES",
  "status": "ACTIVE"
}
```
**Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Metric created successfully",
  "data": {
    "id": 4,
    "title": "Checkout Conversion Rate",
    "value": 3.42,
    "category": "SALES",
    "status": "ACTIVE",
    "updatedAt": "2026-11-18T07:23:12.091Z"
  }
}
```

---

#### 3. Sending Invalid Input to Trigger Validation (`400 Bad Request`)
**Request**:
```http
POST /api/v1/dashboard/metrics HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "title": "X",
  "value": "not-a-number",
  "category": "INVALID_CATEGORY"
}
```
**Response** (`400 Bad Request`):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "issue": "Title must be between 3 and 50 characters"
    },
    {
      "field": "value",
      "issue": "Value must be a valid numeric value"
    },
    {
      "field": "category",
      "issue": "Category must be one of: SALES, TRAFFIC, SYSTEM, REVENUE"
    }
  ]
}
```

---

#### 4. Resource Not Found (`404 Not Found`)
**Request**:
```http
GET /api/v1/dashboard/metrics/9999 HTTP/1.1
Host: localhost:5000
```
**Response** (`404 Not Found`):
```json
{
  "success": false,
  "message": "Metric with ID 9999 not found"
}
```

---

## 6. Live Demo cURL Commands

Copy and paste these commands into any terminal for immediate evaluation during live demo:

```bash
# 1. Health check
curl -X GET http://localhost:5000/health

# 2. Get all dashboard metrics
curl -X GET http://localhost:5000/api/v1/dashboard/metrics

# 3. Filter metrics by category (TRAFFIC)
curl -X GET "http://localhost:5000/api/v1/dashboard/metrics?category=TRAFFIC"

# 4. Get metric by ID
curl -X GET http://localhost:5000/api/v1/dashboard/metrics/1

# 5. Create new metric (201 Created)
curl -X POST http://localhost:5000/api/v1/dashboard/metrics \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Q1 Sales Velocity\", \"value\": 1420.50, \"category\": \"SALES\", \"status\": \"ACTIVE\"}"

# 6. Update metric (200 OK)
curl -X PUT http://localhost:5000/api/v1/dashboard/metrics/2 \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Server CPU Utilization High\", \"value\": 89.9, \"category\": \"SYSTEM\", \"status\": \"CRITICAL\"}"

# 7. Delete metric (200 OK)
curl -X DELETE http://localhost:5000/api/v1/dashboard/metrics/3

# 8. Trigger validation failure (400 Bad Request)
curl -X POST http://localhost:5000/api/v1/dashboard/metrics \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"X\", \"value\": \"invalid_num\", \"category\": \"INVALID_CAT\"}"

# 9. Trigger not found (404 Not Found)
curl -X GET http://localhost:5000/api/v1/dashboard/metrics/9999
```
