# ☕ Java Learning Projects

A collection of hands-on Java backend projects built as part of my personal learning journey. Each project tackles real-world features — REST APIs, authentication, database design, and more — using the Java ecosystem.

---

## 🗂️ Projects

### 📒 [Ledgerr — Invoicing System](./Ledgerr)

A lightweight invoicing web app for managing customers and invoices with a clean single-page frontend.

| | |
|---|---|
| **Tech** | Java 25, JAX-RS 3.1 (Jersey 3), Hibernate 6, Embedded Tomcat 11, MySQL, Vanilla JS |
| **Build** | Maven |

**What I learned:**
- Building and deploying a REST API with an embedded server (no external Tomcat needed)
- ORM with Hibernate 6 and the Jakarta EE 10 ecosystem
- DTO pattern for separating API contracts from internal models
- Connecting a vanilla JS SPA to a Java backend

**Key Features:**
- Invoice & customer CRUD
- Auto-generated invoice numbers
- Line items with automatic tax and total calculation
- Invoice status lifecycle: `DRAFT → SENT → PAID / OVERDUE / CANCELLED`

---

### 👥 [Employee Management System](./employee-management)

A full-stack employee management app with JWT authentication, role-based access control, and a rich SPA frontend.

| | |
|---|---|
| **Tech** | Java 17, JAX-RS (Jersey 2.39), Hibernate 5.6, Apache Tomcat 9, MySQL 8, Vanilla JS |
| **Build** | Maven |

**What I learned:**
- JWT-based authentication and stateless API security
- Role-based access control (ADMIN vs USER permissions)
- BCrypt password hashing
- Pagination, search, and filtering on the backend
- Generating PDF exports from frontend data using jsPDF

**Key Features:**
- JWT login/logout with role-based UI
- Employee CRUD with department, position, salary, and status tracking
- Dashboard with stats cards and department chart
- Real-time debounced search and filters
- PDF export of employee data
- DELETE restricted to ADMIN role only

---

## 🛠️ Tech Stack Overview

| | Ledgerr | Employee Management System |
|---|---|---|
| Java Version | 25 | 17 |
| JAX-RS | Jersey 3 (Jakarta EE 10) | Jersey 2.39 |
| ORM | Hibernate 6 | Hibernate 5.6 |
| Server | Embedded Tomcat 11 | Apache Tomcat 9 |
| Auth | — | JWT + BCrypt |
| Database | MySQL 8 | MySQL 8 |
| Frontend | Vanilla JS SPA | Vanilla JS SPA |
| PDF Export | — | jsPDF |

---

## 🚀 Running Any Project

Each project folder contains its own `README.md` with full setup steps. The general flow is:

```bash
# 1. Clone the repo
git clone https://github.com/your-username/java-learning-projects.git

# 2. Enter a project folder
cd Ledgerr  # or cd employee-management

# 3. Set up the database
mysql -u root -p < sql/schema.sql

# 4. Update DB credentials in hibernate.cfg.xml

# 5. Build and run
mvn clean package
mvn exec:java -Dexec.mainClass="com.main.Main"
```

---

## 📈 What I'm Building Toward

- Layered architecture (Controller → Service → DAO → Model)
- Secure, stateless REST APIs
- Clean database schema design with proper relationships
- Connecting Java backends to interactive frontends
- Gradually levelling up from basic CRUD to auth, roles, and more complex features

---

*Always learning — feedback and suggestions are welcome!*
