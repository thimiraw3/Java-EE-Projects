# Employee Management System (EMS)

A full-stack **Employee Management System** built with **Jersey (JAX-RS)**, **Hibernate**, **Maven**, **MySQL**, and a vanilla JS single-page frontend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| REST Framework | Jersey 2.39 (JAX-RS) |
| ORM / Persistence | Hibernate 5.6 + MySQL 8 |
| Build Tool | Maven |
| Authentication | JWT (jjwt) + BCrypt |
| Frontend | Vanilla JS + Hardcoded CSS (SPA) |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Server | Apache Tomcat 9+ |

---

## Project Structure

```
employee-management/
├── pom.xml
├── setup.sql                         # MySQL database setup
└── src/
    └── main/
        ├── java/com/ems/
        │   ├── auth/
        │   │   ├── JwtUtil.java       # JWT token generation/validation
        │   │   └── Secured.java       # Custom auth annotation
        │   ├── config/
        │   │   ├── HibernateUtil.java  # SessionFactory singleton
        │   │   ├── CORSFilter.java     # CORS headers
        │   │   └── AppConfig.java      # Startup/shutdown hooks
        │   ├── entities/
        │   │   ├── Employee.java       # Employee Hibernate entity
        │   │   └── User.java           # User entity for auth
        │   ├── services/
        │   │   ├── EmployeeService.java # Business logic + DB ops
        │   │   ├── AuthService.java    # Login/register logic
        │   │   └── UserService.java    # Business logic + DB ops for Users
        │   ├── controller/
        │   │   ├── AuthController.java     # REST endpoints /api/auth
        │   │   ├── EmployeeController.java # REST endpoints /api/employees
        │   │   └── UserController.java     # REST endpoints /api/user
        │   ├── filters/
        │   │   └── AuthenticationFilter.java # JWT request filter
        │   ├── exceptions/
        │   │   └── GlobalExceptionMapper.java # Error handling
        │   │
        │   └── Main.java         # Main Class
        ├── resources/
        │   └── hibernate.cfg.xml       # Hibernate configuration
        └── webapp/
            ├── css/
            │   └── style.css
            ├── js/
            │   └── index.js
            ├── WEB-INF/
            │   └── web.xml
            └── index.html              # Single-page frontend
```

---

## Setup & Running

### 1. Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Apache Tomcat 9+

### 2. Database Setup

```bash
mysql -u root -p < setup.sql
```

Or manually:
```sql
CREATE DATABASE employee_db CHARACTER SET utf8mb4;
```

### 3. Configure Database Connection

Edit `src/main/resources/hibernate.cfg.xml`:

```xml
<property name="hibernate.connection.url">
  jdbc:mysql://localhost:3306/employee_db?useSSL=false&serverTimezone=UTC
</property>
<property name="hibernate.connection.username">your_username</property>
<property name="hibernate.connection.password">your_password</property>
```

### 4. Build

```bash
mvn clean package -DskipTests
```

### 5. Deploy to Tomcat

Copy `target/employee-management.war` to your Tomcat `webapps/` directory, or use:

```bash
mvn tomcat7:run
```

App will be available at: `http://localhost:8080/ems`


## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login, returns JWT | No |
| POST | `/api/auth/register` | Register new user | No |

**Login Request:**
```json
{ "username": "admin", "password": "admin123" }
```

**Login Response:**
```json
{ "token": "eyJ...", "username": "admin", "role": "ADMIN" }
```

### Employees

All employee endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/employees` | List/search employees (paginated) | ALL |
| GET | `/api/employees/{id}` | Get employee by ID | ALL |
| POST | `/api/employees` | Create employee | USER/ADMIN |
| PUT | `/api/employees/{id}` | Update employee | USER/ADMIN |
| DELETE | `/api/employees/{id}` | Delete employee | ADMIN only |
| GET | `/api/employees/stats/dashboard` | Dashboard statistics | ALL |
| GET | `/api/employees/meta/departments` | List all departments | ALL |
| GET | `/api/employees/meta/positions` | List all positions | ALL |

**Query Parameters (GET /api/employees):**
- `page` — page number (default: 1)
- `size` — page size (default: 10)
- `name` — search by name (partial match)
- `position` — search by position (partial match)
- `department` — filter by department
- `status` — filter by status (ACTIVE, INACTIVE, ON_LEAVE)
- `hireDate` — filter by exact hire date (yyyy-MM-dd)

**Create/Update Employee Body:**
```json
{
  "name": "Alice Johnson",
  "position": "Senior Engineer",
  "department": "Engineering",
  "hireDate": "2023-01-15",
  "salary": 95000.00,
  "email": "alice@company.com",
  "phone": "+1234567890",
  "status": "ACTIVE"
}
```

---

## Frontend Features

- **Dashboard** — Stats cards (total, active, avg salary, recent hires), department bar chart, recent employees list
- **Employee Table** — Paginated employee list with avatars, badges, salary formatting
- **Search** — Real-time debounced search by name, position, department
- **Filters** — Filter by department and status
- **Create** — Modal form to add new employees with validation
- **Edit** — Pre-filled modal form to update employee details
- **Delete** — Confirmation modal (ADMIN only)
- **PDF Export** — Export current filtered view to formatted PDF
- **Authentication** — JWT login/logout with role-based UI
- **Toast Notifications** — Success/error feedback on all operations

---

## Security

- **JWT Authentication** — All `/api/employees/*` endpoints require a valid JWT
- **Role-based Access** — DELETE restricted to ADMIN role; GET/POST/PUT for USER and ADMIN
- **BCrypt Password Hashing** — All passwords stored with salt factor 12
- **Input Validation** — Server-side validation with descriptive error messages
- **CORS** — Configured to allow cross-origin requests (adjust for production)

---

## Environment Configuration

For production, change these values in `hibernate.cfg.xml`:

```xml
<!-- Change to validate or none in production -->
<property name="hibernate.hbm2ddl.auto">validate</property>

<!-- Disable SQL logging -->
<property name="hibernate.show_sql">false</property>
```

And update the JWT secret in `JwtUtil.java`:
```java
private static final String SECRET_KEY = "your-very-long-production-secret-key-here";
```
