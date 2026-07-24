# Smart Employee & Project Management System

Full-stack web application for employee, project, and task management with secure JWT authentication, role-based dashboards (Admin & Employee), advanced search & filtering, profile management, audit logging, and exportable PDF/Excel reports.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | ReactJS, React Router, Axios, Material UI (MUI), HTML5, CSS3, JavaScript |
| Backend | Java 17, Spring Boot, Spring Web, Spring Security (JWT), Spring Data JPA, Spring Validation, Hibernate, Lombok |
| Database | MySQL (H2 supported for local development) |
| Reports | Apache POI (Excel), OpenPDF (PDF) |
| API Documentation | Swagger (Springdoc OpenAPI), Postman |
| Testing | JUnit 5, Mockito, Spring Security Test |
| Build & Deployment | Maven (Backend), npm (Frontend), Docker |

## Features

- **Authentication** — Register, Login, JWT authentication, role-based access (Admin & Employee), secure password encryption
- **Employee Management** — CRUD, search, pagination, sorting, department & role filters, current user profile management, profile image upload/update/remove
- **Project Management** — CRUD, assign/unassign employees, status, priority & deadline management, search, pagination, sorting, deadline filters
- **Task Management** — CRUD, task assignment, status & progress tracking, remarks, search, pagination, sorting, priority, assignee & due-date filters
- **Dashboards** — Separate Admin & Employee dashboards with live statistics and project/task summaries
- **Reports** — Employee-wise, Project-wise, Pending Tasks & All Reports with PDF and Excel export
- **User Interface** — Responsive Material UI design, Dark Mode, loading indicators, snackbar notifications and form validation
- **Backend** — RESTful APIs, layered architecture, DTO pattern, global exception handling, Spring Validation and audit logging
- **Documentation & Testing** — Swagger API documentation, Postman collection, Docker support, JUnit 5 unit testing with Mockito, and integration testing

## Project Structure

```
smart-employee-management/
├── backend/                         # Spring Boot Backend (JWT, JPA, REST APIs)
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                        # React Application (React Router, Axios, Material UI)
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   └── nginx.conf
├── database/
│   └── schema.sql                   # MySQL schema and sample data
├── docs/
│   ├── FLOWCHART.md                 # System flow diagrams
│   ├── SCREENSHOTS1/                # Application screenshots (Part 1)
│   ├── SCREENSHOTS2/                # Application screenshots (Part 2)
│   └── SCREENSHOTS3/                # Application screenshots (Part 3)
├── postman/
│   └── Smart_Employee_Management.postman_collection.json
├── docker-compose.yml               # Multi-container Docker configuration
├── .gitignore
└── README.md
```

## Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8+ (or run against the bundled H2 in-memory DB for a zero-config start)
- Docker (Optional, for containerized deployment)

## Database Setup

Run the following command to create the database schema and import the sample data:

```bash
mysql -u root -p < database/schema.sql
```

This script creates the `smart_emp_db` database, required tables, relationships, indexes, and sample data for the application.

> **Default Login Credentials**

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | Admin@123 | ADMIN |
| john.doe@company.com | Emp@123 | EMPLOYEE |
| jane.smith@company.com | Emp@123 | EMPLOYEE |
| mike.wilson@company.com | Emp@123 | EMPLOYEE |

Alternatively, you can start the complete application using Docker:

```bash
docker compose up --build
```

## Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- H2 console (if using the in-memory profile): `http://localhost:8080/h2-console`

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs at: `http://localhost:3000`

## Default Users

The application automatically creates the following accounts during startup:

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | Admin@123 | ADMIN |
| john.doe@company.com | Emp@123 | EMPLOYEE |
| jane.smith@company.com | Emp@123 | EMPLOYEE |
| mike.wilson@company.com | Emp@123 | EMPLOYEE |


## API Overview

Endpoints as coded in `backend/src/main/java/com/smartemp/controller/*`.
All responses are wrapped in a common envelope:
`{ success, message, data, errors, timestamp }`.

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| POST | `/api/auth/register` | Public | `RegisterRequest`: email, password, firstName, lastName, role, department, designation, phone |
| POST | `/api/auth/login` | Public | Returns `data.token` (JWT) + `data.user` |
| GET | `/api/employees` | Auth | Query: search, department, role, page, size, sortBy, sortDir |
| GET | `/api/employees/{id}` | Auth | Get employee by ID |
| GET | `/api/employees/me` | Auth | Get current user's profile |
| POST | `/api/employees` | ADMIN | Create employee |
| PUT | `/api/employees/{id}` | ADMIN | Update employee |
| POST | `/api/employees/{id}/upload-profile` | ADMIN | Upload/update employee profile image |
| POST | `/api/employees/me/upload-profile` | Auth | Upload/update current user's profile image |
| DELETE | `/api/employees/me/profile` | Auth | Remove current user's profile image |
| DELETE | `/api/employees/{id}` | ADMIN | Delete employee |
| GET | `/api/projects` | Auth | Query: search, status, priority, page, size, sortBy, sortDir |
| GET | `/api/projects/{id}` | Auth | Get project by ID |
| GET | `/api/projects/employee/{employeeId}` | Auth | Projects assigned to an employee |
| POST | `/api/projects` | ADMIN | Create project |
| PUT | `/api/projects/{id}` | ADMIN | Update project |
| PUT | `/api/projects/{id}/assign` | ADMIN | Body: `Set<Long>` employee IDs (replaces assigned employees) |
| DELETE | `/api/projects/{id}` | ADMIN | Delete project |
| GET | `/api/tasks` | Auth | Query: search, status, priority, projectId, assigneeId, dueBefore, dueAfter, page, size, sortBy, sortDir |
| GET | `/api/tasks/{id}` | Auth | Get task by ID |
| GET | `/api/tasks/assignee/{assigneeId}` | Auth | Tasks assigned to an employee |
| GET | `/api/tasks/project/{projectId}` | Auth | Tasks belonging to a project |
| POST | `/api/tasks` | ADMIN | Create task |
| PUT | `/api/tasks/{id}` | ADMIN | Update task |
| PATCH | `/api/tasks/{id}/progress` | Auth | Update task status, progress and remarks |
| DELETE | `/api/tasks/{id}` | ADMIN | Delete task |
| GET | `/api/dashboard/admin` | ADMIN | Admin dashboard statistics |
| GET | `/api/dashboard/employee` | Auth | Employee dashboard statistics |
| GET | `/api/reports/employee/{employeeId}` | ADMIN | Employee task report |
| GET | `/api/reports/project/{projectId}` | Auth | Project progress report |
| GET | `/api/reports/pending` | Auth | Pending task report |
| GET | `/api/reports/export/excel` | ADMIN | Query: `type`, `employeeId`, `projectId` |
| GET | `/api/reports/export/pdf` | ADMIN | Query: `type`, `employeeId`, `projectId` |

Enums (`com.smartemp.model.enums`):
- **Role**: `ADMIN`, `EMPLOYEE`
- **Priority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **ProjectStatus**: `PLANNING`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`
- **TaskStatus**: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `BLOCKED`

Full request/response examples:
[`postman/Smart_Employee_Management.postman_collection.json`](postman/Smart_Employee_Management.postman_collection.json).

## Postman

1. Import `postman/Smart_Employee_Management.postman_collection.json`.
2. Confirm the collection variable `baseUrl` matches your running backend
   (defaults to `http://localhost:8080`).
3. Run **Auth → Login** first — its test script reads `data.token` from the
   response and saves it into the `token` collection variable.
4. All other requests use Bearer `{{token}}` auth automatically.


## Testing

The project includes automated unit and integration tests covering the authentication and service layers.

### Test Classes
- AuthControllerTest
- EmployeeServiceTest
- ProjectServiceTest
- TaskServiceTest
- ReportServiceTest

### Frameworks
- JUnit 5
- Mockito
- Spring Security Test


## Documentation

- [`docs/FLOWCHART.md`](docs/FLOWCHART.md) — Mermaid diagrams for the
  authentication, employee, project, and task flows, the layered API
  request flow, and the database ER diagram.
  

## Submission Checklist

- [x] Database schema and sample data provided
- [x] Backend application builds and runs successfully
- [x] Frontend application builds and runs successfully
- [x] JWT Authentication and Role-Based Authorization implemented
- [x] Employee Management (CRUD)
- [x] Project Management (CRUD)
- [x] Task Management (CRUD)
- [x] Employee-to-Project Assignment
- [x] Task Status, Progress and Remarks Management
- [x] Admin Dashboard
- [x] Employee Dashboard
- [x] Search, Pagination, Sorting and Filtering
- [x] Employee, Project, Pending Task and All Task Reports
- [x] PDF Report Export
- [x] Excel Report Export
- [x] Profile Picture Upload, Update and Remove
- [x] Audit Logging
- [x] Dark Mode
- [x] Swagger API Documentation
- [x] Postman Collection
- [x] Docker Support
- [x] Unit & Integration Testing (JUnit 5, Mockito, Spring Security Test)
- [x] Flowcharts and Project Documentation
- [x] README Documentation

## License

MIT
