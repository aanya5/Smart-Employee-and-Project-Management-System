# Flowcharts & Diagrams

This document visualizes the major flows in the Smart Employee & Project
Management System. All diagrams are written in [Mermaid](https://mermaid.js.org/)
and render automatically on GitHub, GitLab, and in most Markdown previewers
(including the Cursor/VS Code Markdown preview).


## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Employee Management Flow](#2-employee-management-flow)
3. [Project Management Flow](#3-project-management-flow)
4. [Task Management Flow](#4-task-management-flow)
5. [Reports Flow](#5-reports-flow)
6. [API Request Flow (Layered Architecture)](#6-api-request-flow-layered-architecture)
7. [Database ER Diagram](#7-database-er-diagram)

---

## 1. Authentication Flow

```mermaid
flowchart TD
    A([Start]) --> B{Has account?}
    B -- No --> C[POST /api/auth/register]
    C --> D[Validate input & check email uniqueness]
    D -- Invalid/Exists --> E[400 Bad Request]
    D -- Valid --> F[Hash password with BCrypt]
    F --> G[Save users row - role EMPLOYEE by default]
    G --> H[Return 201 + ApiResponse&lt;AuthResponse&gt;]
    H --> I[POST /api/auth/login]

    B -- Yes --> I

    I --> J[AuthenticationManager authenticates email+password]
    J -- Bad credentials --> K[401 Unauthorized]
    J -- OK --> L[JwtTokenProvider generates signed JWT]
    L --> M[Return 200 + ApiResponse&lt;AuthResponse&gt; data.token, data.user]
    M --> N[Client stores data.token - e.g. localStorage]
    N --> O[Client attaches Authorization: Bearer token to every request]
    O --> P{JwtAuthenticationFilter validates token?}
    P -- Expired/Invalid --> Q[401 Unauthorized]
    P -- Valid --> R{"@PreAuthorize role check passes?"}
    R -- No --> S[403 Forbidden]
    R -- Yes --> T[Request proceeds to controller]
    T --> U([End])
```

---

## 2. Employee Management Flow


```mermaid
flowchart TD
    A([Admin logs in]) --> B[Open Employees module]
    B --> C[GET /api/employees?search=&department=&role=&page=&size=&sortBy=&sortDir=]
    C --> D[View paginated list, filter by department/role, search by name/email]
    D --> E{Action?}

    E -- Add Employee --> F[POST /api/employees - ADMIN only]
    F --> G[Create user: email, password hash, firstName, lastName, role, department, designation, phone]
    G --> H[Write AuditLog CREATE entry]
    H --> I[Return 201 + ApiResponse<UserResponse>]
    I --> D

    E -- Edit Employee --> J[PUT /api/employees/id - ADMIN only]
    J --> K[Update employee details; re-hash password only if provided]
    K --> H

    E -- View Details --> L[GET /api/employees/id]
    L --> M[Show employee profile]
    M --> D

    E -- Upload Profile Image --> P[POST /api/employees/id/upload-profile - ADMIN only]
    P --> Q[Save profile image]
    Q --> D

    E -- Delete --> N[DELETE /api/employees/id - ADMIN only]
    N --> O[Delete user]
    O --> H

    R([Employee logs in]) --> S[GET /api/employees/me]
    S --> T[View own profile]
    T --> U{Profile Action?}

    U -- Upload/Update Image --> V[POST /api/employees/me/upload-profile]
    V --> W[Save profile image]
    W --> T

    U -- Remove Image --> X[DELETE /api/employees/me/profile]
    X --> Y[Delete profile image]
    Y --> T
```

---

## 3. Project Management Flow

```mermaid
flowchart TD
    A([Admin logs in]) --> B[Open Projects module]
    B --> C[GET /api/projects?search=&status=&priority=&deadlineFrom=&deadlineTo=&page=&size=&sortBy=&sortDir=]
    C --> D{Action?}

    D -- Create Project --> E[POST /api/projects - ADMIN only]
    E --> F[Set name, description, priority, startDate, deadline, employeeIds]
    F --> G[Initial project status = PLANNING]
    G --> H[Return 201 + ApiResponse<ProjectResponse>]
    H --> C

    D -- Assign / Unassign Employees --> I[PUT /api/projects/id/assign - ADMIN only]
    I --> J["Body: Set<Long> employee IDs"]
    J --> K[Assigned employees replaced with provided set]
    K --> C

    D -- Update Project --> L[PUT /api/projects/id - ADMIN only]
    L --> M[Update project details, priority or deadline]
    M --> C

    D -- Task Progress Changes --> N[Task created or updated]
    N --> O[Recalculate project status automatically]
    O --> P{Task Progress}
    P -- No tasks / All TODO --> Q[PLANNING]
    P -- Mixed task states --> R[IN_PROGRESS]
    P -- All COMPLETED --> S[COMPLETED]
    P -- Manual ON_HOLD / CANCELLED --> T[Status preserved]
    Q --> C
    R --> C
    S --> C
    T --> C

    D -- Delete Project --> U[DELETE /api/projects/id - ADMIN only]
    U --> V[Cascade delete project tasks and assignments]
    V --> C
```

---

## 4. Task Management Flow

```mermaid
flowchart TD
    A([Admin creates task]) --> B[POST /api/tasks - title, projectId, assigneeId, priority, dueDate]
    B --> C[Task saved with default status = TODO, progress = 0]
    C --> D[Employee logs in]
    D --> E[GET /api/tasks/assignee/id - View assigned tasks]
    E --> F{Employee updates task?}

    F -- Yes --> G[PATCH /api/tasks/id/progress]
    G --> H["Body: TaskUpdateRequest { status?, progress?, remarks? }"]
    H --> I[Update provided fields only]
    I --> J{Status / Progress changed?}

    J -- Status --> K[TODO / IN_PROGRESS / IN_REVIEW / COMPLETED / BLOCKED]
    J -- Progress --> L[0-100]

    K --> M[Save task & update timestamp]
    L --> M

    M --> N[Recalculate project status automatically]
    N --> O[Update dashboards and reports]

    O --> P{Admin reviews?}
    P -- Needs changes --> Q[PUT /api/tasks/id - ADMIN only]
    Q --> M
    P -- Completed --> R([End])
```

---

## 5. Reports Flow

```mermaid
flowchart TD
    A([User logs in]) --> B[Open Reports module]
    B --> C{User Role?}

    C -- ADMIN --> D[Access Employee, Project & Pending Task Reports]
    C -- EMPLOYEE --> E[Access Project Report & Own Pending Tasks]

    D --> F[Select report filters]
    E --> F

    F --> G[Generate report]
    G --> H[Display report]

    H --> I{Export?}
    I -- Excel --> J[Generate Excel report]
    I -- PDF --> K[Generate PDF report]
    I -- No --> L([End])

    J --> L
    K --> L
```

---

## 6. API Request Flow (Layered Architecture)

End-to-end path of a typical authenticated request through the Spring Boot
backend, e.g. `GET /api/employees/5`.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (React SPA)
    participant F as JwtAuthenticationFilter
    participant Ctrl as Controller<br/>(EmployeeController)
    participant Svc as Service<br/>(EmployeeService)
    participant Repo as Repository<br/>(UserRepository / JPA)
    participant DB as MySQL / H2

    C->>F: HTTP GET /api/employees/5<br/>Authorization: Bearer <JWT>
    F->>F: Validate JWT signature + expiry
    F->>F: Load UserDetails, set SecurityContext
    F->>Ctrl: Forward request (authenticated)
    Ctrl->>Ctrl: @PreAuthorize role check (if present)
    Ctrl->>Svc: employeeService.getById(5)
    Svc->>Repo: userRepository.findById(5)
    Repo->>DB: SELECT * FROM users WHERE id = 5
    DB-->>Repo: Result set (1 row)
    Repo-->>Svc: User entity (or empty Optional)
    Svc->>Svc: EntityMapper.toUserResponse(user)
    Svc-->>Ctrl: UserResponse
    Ctrl-->>F: ResponseEntity 200 OK + ApiResponse&lt;UserResponse&gt;
    F-->>C: HTTP 200 OK (application/json)

    Note over Ctrl,Svc: On error (not found, validation, duplicate email, etc.)<br/>GlobalExceptionHandler maps exceptions to a standardized<br/>ApiResponse.error(...) body (400/401/403/404/500).
```

---

## 7. Database ER Diagram

This diagram represents the database schema used by the Smart Employee & Project Management System.

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar email "UNIQUE"
        varchar password "BCrypt hash"
        varchar role "ADMIN | EMPLOYEE"
        boolean enabled
        timestamp created_at
    }

    EMPLOYEES {
        bigint id PK
        varchar first_name
        varchar last_name
        varchar email "UNIQUE"
        varchar phone
        varchar department
        varchar designation
        date date_of_joining
        decimal salary
        varchar status "ACTIVE | INACTIVE"
        bigint user_id FK "-> USERS.id, UNIQUE, nullable"
    }

    PROJECTS {
        bigint id PK
        varchar name
        varchar description
        varchar status "PLANNING | IN_PROGRESS | ON_HOLD | COMPLETED | CANCELLED"
        varchar priority "LOW | MEDIUM | HIGH | CRITICAL"
        date start_date
        date end_date
        date deadline
        varchar created_by "creator email, not a FK"
        timestamp created_at
        timestamp updated_at
    }

    PROJECT_EMPLOYEES {
        bigint project_id FK "-> PROJECTS.id"
        bigint employee_id FK "-> EMPLOYEES.id"
    }

    TASKS {
        bigint id PK
        varchar title
        varchar description
        bigint project_id FK "-> PROJECTS.id"
        bigint assigned_to FK "-> EMPLOYEES.id, nullable"
        varchar status "TODO | IN_PROGRESS | REVIEW | DONE"
        int progress "0-100"
        varchar priority "LOW | MEDIUM | HIGH | CRITICAL"
        date deadline
        varchar remarks
        timestamp created_at
        timestamp updated_at
    }

    USERS ||--o| EMPLOYEES : "has profile"
    PROJECTS ||--o{ PROJECT_EMPLOYEES : "staffs"
    EMPLOYEES ||--o{ PROJECT_EMPLOYEES : "assigned to"
    PROJECTS ||--o{ TASKS : "contains"
    EMPLOYEES ||--o{ TASKS : "assigned"
```
