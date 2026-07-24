-- =====================================================================
-- Smart Employee & Project Management System
-- MySQL Schema + Seed Data
-- =====================================================================
-- Usage:
--   mysql -u root -p < database/schema.sql
--
-- This schema mirrors the JPA entities under
-- backend/src/main/java/com/smartemp/entity/*:
--   User, Employee, Project, Task (+ Role/EmployeeStatus/ProjectStatus/
--   TaskStatus/Priority enums, all persisted as VARCHAR via
--   @Enumerated(EnumType.STRING)).
--
-- IMPORTANT - read this before relying on this file:
--   The backend module currently contains TWO parallel, inconsistent
--   sets of entities/DTOs/services (one under com.smartemp.entity /
--   com.smartemp.dto.{employee,project,task,auth,...} used by
--   DataInitializer/TaskService/DashboardService/ReportService, and an
--   older one under com.smartemp.model.entity / com.smartemp.dto.
--   {request,response} used by the actual @RestController classes).
--   This schema follows the FIRST (entity.*) model because it matches
--   the 5-table shape requested for this submission (separate
--   `employees` table). See the "Known Backend Inconsistencies" note in
--   the root README for details - the two implementations need to be
--   reconciled before `mvn spring-boot:run` will work end-to-end.
--
--   Database name: this script creates `smart_emp_db`, matching
--   backend/src/main/resources/application.properties
--   (spring.datasource.url=jdbc:mysql://localhost:3306/smart_emp_db...).
--   Database name: this script creates `smart_emp_db`, matching the MySQL configuration used by Docker and the application's MySQL datasource settings.
--
-- Notes on passwords:
--   backend/src/main/java/com/smartemp/config/DataInitializer.java seeds
--   admin@company.com and 4 employees using Spring Security's
--   BCryptPasswordEncoder at application startup (guarded by
--   `if (userRepository.existsByEmail("admin@company.com")) return;`,
--   so it only runs once against an empty table). That code path is
--   authoritative for real logins.
--
--   The INSERT statements below embed pre-computed bcrypt hashes
--   (cost factor 10) so the database is fully populated even if
--   reviewed independently of the running app:
--     Admin@123 -> $2b$10$4iUG.aI1VdH2o07MomRM9uURMShK50az7rhmUsJE9F5A2QcYhFbiu
--     Emp@123   -> $2b$10$fGIqmmlGoOOs2wWVPaYMQe49jOmiTRK145pqdMMnO8yAZLstOfMmm
--   Both were generated with Python's `bcrypt` library and verified with
--   bcrypt.checkpw(...) before being committed here. Spring Security's
--   BCryptPasswordEncoder accepts $2a$/$2b$/$2y$ prefixes interchangeably.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. DATABASE
-- ---------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS smart_emp_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smart_emp_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_employees;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS  (mirrors entity.User: id, email, password, role, enabled,
--    createdAt - there is no "name" column; display names live on the
--    linked `employees` row via first_name/last_name)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(150)  NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'EMPLOYEE',
    enabled     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'EMPLOYEE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_users_role ON users (role);

-- ---------------------------------------------------------------------
-- 2. EMPLOYEES  (mirrors entity.Employee: firstName, lastName, email,
--    phone, department, designation, dateOfJoining, salary, status,
--    plus the 1:1 link back to `users` via user_id)
-- ---------------------------------------------------------------------
CREATE TABLE employees (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(150) NOT NULL,
    phone             VARCHAR(20)  NULL,
    department        VARCHAR(100) NULL,
    designation       VARCHAR(100) NULL,
    date_of_joining   DATE         NULL,
    salary            DECIMAL(12,2) NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    user_id           BIGINT       NULL,
    CONSTRAINT uq_employees_email UNIQUE (email),
    CONSTRAINT uq_employees_user_id UNIQUE (user_id),
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_employees_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_employees_department ON employees (department);
CREATE INDEX idx_employees_designation ON employees (designation);
CREATE INDEX idx_employees_status ON employees (status);
CREATE INDEX idx_employees_name ON employees (last_name, first_name);

-- ---------------------------------------------------------------------
-- 3. PROJECTS  (mirrors entity.Project: name, description, status,
--    priority, startDate, endDate, deadline (3 separate date fields),
--    createdBy is a plain VARCHAR - it stores the creator's email, not
--    a foreign key - and createdAt/updatedAt timestamps)
-- ---------------------------------------------------------------------
CREATE TABLE projects (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    description  VARCHAR(2000) NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PLANNING',
    priority     VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    start_date   DATE         NULL,
    end_date     DATE         NULL,
    deadline     DATE         NULL,
    created_by   VARCHAR(150) NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_projects_status CHECK (status IN ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_projects_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_projects_name ON projects (name);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_priority ON projects (priority);
CREATE INDEX idx_projects_deadline ON projects (deadline);

-- ---------------------------------------------------------------------
-- 4. PROJECT_EMPLOYEES  (plain @JoinTable behind entity.Project's
--    @ManyToMany `employees` field - composite key, no surrogate id
--    and no extra columns)
-- ---------------------------------------------------------------------
CREATE TABLE project_employees (
    project_id   BIGINT NOT NULL,
    employee_id  BIGINT NOT NULL,
    PRIMARY KEY (project_id, employee_id),
    CONSTRAINT fk_pe_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_pe_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_pe_employee_id ON project_employees (employee_id);

-- ---------------------------------------------------------------------
-- 5. TASKS  (mirrors entity.Task: title, description, project,
--    assignedTo - FK column literally named `assigned_to` - status,
--    progress, priority, deadline, remarks, createdAt/updatedAt)
-- ---------------------------------------------------------------------
CREATE TABLE tasks (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    description  VARCHAR(2000) NULL,
    project_id   BIGINT       NOT NULL,
    assigned_to  BIGINT       NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    progress     INT          NOT NULL DEFAULT 0,
    priority     VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    deadline     DATE         NULL,
    remarks      VARCHAR(2000) NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES employees (id) ON DELETE SET NULL,
    CONSTRAINT chk_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_tasks_progress CHECK (progress BETWEEN 0 AND 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_tasks_title ON tasks (title);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_tasks_priority ON tasks (priority);
CREATE INDEX idx_tasks_deadline ON tasks (deadline);
CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);

-- =====================================================================
-- SEED DATA
-- Matches backend/src/main/java/com/smartemp/config/DataInitializer.java
-- 1:1 (same users, employees, projects, and tasks), with relative dates
-- (LocalDate.now() +/- N days) replaced by fixed illustrative dates.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Users
--   admin@company.com    / Admin@123 -> ADMIN
--   john.doe@company.com / Emp@123   -> EMPLOYEE
--   (3 more employees, all password Emp@123)
-- ---------------------------------------------------------------------
INSERT INTO users (id, email, password, role) VALUES
    (1, 'admin@company.com',      '$2b$10$4iUG.aI1VdH2o07MomRM9uURMShK50az7rhmUsJE9F5A2QcYhFbiu', 'ADMIN'),
    (2, 'john.doe@company.com',   '$2b$10$fGIqmmlGoOOs2wWVPaYMQe49jOmiTRK145pqdMMnO8yAZLstOfMmm', 'EMPLOYEE'),
    (3, 'jane.smith@company.com', '$2b$10$fGIqmmlGoOOs2wWVPaYMQe49jOmiTRK145pqdMMnO8yAZLstOfMmm', 'EMPLOYEE'),
    (4, 'mike.brown@company.com', '$2b$10$fGIqmmlGoOOs2wWVPaYMQe49jOmiTRK145pqdMMnO8yAZLstOfMmm', 'EMPLOYEE'),
    (5, 'sara.wilson@company.com','$2b$10$fGIqmmlGoOOs2wWVPaYMQe49jOmiTRK145pqdMMnO8yAZLstOfMmm', 'EMPLOYEE');

-- ---------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------
INSERT INTO employees (id, first_name, last_name, email, phone, department, designation, date_of_joining, salary, status, user_id) VALUES
    (1, 'John', 'Doe',    'john.doe@company.com',    '9876543210', 'Engineering',        'Senior Software Engineer', '2022-03-15', 75000.00, 'ACTIVE', 2),
    (2, 'Jane', 'Smith',  'jane.smith@company.com',  '9876543211', 'Engineering',        'Software Engineer',        '2023-01-10', 62000.00, 'ACTIVE', 3),
    (3, 'Mike', 'Brown',  'mike.brown@company.com',  '9876543212', 'Quality Assurance',  'QA Engineer',               '2023-06-01', 55000.00, 'ACTIVE', 4),
    (4, 'Sara', 'Wilson', 'sara.wilson@company.com', '9876543213', 'Human Resources',    'HR Executive',              '2021-11-20', 48000.00, 'ACTIVE', 5);

-- ---------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------
INSERT INTO projects (id, name, description, status, priority, start_date, end_date, deadline, created_by) VALUES
    (1, 'Company Website Revamp',      'Redesign and rebuild the corporate website with a modern stack.',       'IN_PROGRESS', 'HIGH',     '2026-06-25', '2026-09-15', '2026-08-30', 'admin@company.com'),
    (2, 'Mobile App Development',      'Build a cross-platform mobile app for employee self-service.',          'PLANNING',    'CRITICAL', '2026-07-26', '2026-11-15', '2026-11-01', 'admin@company.com'),
    (3, 'Internal Tools Automation',    'Automate recurring HR and finance workflows.',                          'ON_HOLD',     'MEDIUM',   '2026-05-15', '2026-07-15', '2026-07-10', 'admin@company.com');

-- ---------------------------------------------------------------------
-- Project <-> Employee assignments
-- ---------------------------------------------------------------------
INSERT INTO project_employees (project_id, employee_id) VALUES
    (1, 1), -- Company Website Revamp <- John
    (1, 2), -- Company Website Revamp <- Jane
    (2, 1), -- Mobile App Development <- John
    (2, 3), -- Mobile App Development <- Mike
    (3, 4); -- Internal Tools Automation <- Sara

-- ---------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------
INSERT INTO tasks (project_id, assigned_to, title, description, status, priority, progress, deadline, remarks) VALUES
    (1, 1, 'Design homepage wireframes',         'Create wireframes for the new homepage layout.', 'DONE',        'HIGH',     100, '2026-07-10', 'Approved by stakeholders.'),
    (1, 1, 'Implement authentication module',    'JWT based auth with role support.',              'IN_PROGRESS', 'HIGH',     60,  '2026-08-05', 'In code review.'),
    (1, 2, 'Build responsive UI components',     'Reusable UI component library.',                 'IN_PROGRESS', 'MEDIUM',   40,  '2026-08-10', NULL),
    (1, 2, 'Set up CI/CD pipeline',               'Automate build, test and deploy for website.',   'TODO',        'MEDIUM',   0,   '2026-08-15', NULL),
    (2, 1, 'Define app architecture',            'Choose stack and define module boundaries.',     'REVIEW',      'CRITICAL', 80,  '2026-07-28', 'Pending final sign-off.'),
    (2, 3, 'Set up QA test plans',                'Prepare test plans for mobile app modules.',     'TODO',        'HIGH',     0,   '2026-08-20', NULL),
    (3, 4, 'Automate leave approval workflow',    'Automate the manual leave approval process.',    'IN_PROGRESS', 'MEDIUM',   30,  '2026-07-15', 'Blocked - waiting on HR sign-off.');
