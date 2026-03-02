# Ledgerr — Web-Based Invoicing System

A full-stack invoicing system built with **Java Servlets**, **Hibernate ORM**, **MySQL**, **AJAX**, and vanilla **JavaScript**.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS, AJAX (Fetch API)       |
| Backend    | Java 11, Jakarta Servlets 4.0                   |
| ORM        | Hibernate 5.6 with JPA annotations              |
| Database   | MySQL 8.0                                       |
| Build      | Maven 3.x                                       |
| Server     | Apache Tomcat 9.x                               |
| JSON       | Jackson Databind 2.15                           |
| Date Picker| Flatpickr (CDN)                                 |

---

## Project Structure

```
invoicing-system/
├── pom.xml
├── sql/
│   └── schema.sql                      ← Database schema + sample data
└── src/main/
    ├── java/com/invoicing/
    │   ├── model/
    │   │   ├── Customer.java           ← @Entity with Hibernate annotations
    │   │   ├── Invoice.java            ← @Entity (status enum, totals)
    │   │   └── InvoiceItem.java        ← @Entity (line items)
    │   ├── dao/
    │   │   ├── CustomerDAO.java        ← CRUD + search (HQL queries)
    │   │   └── InvoiceDAO.java         ← CRUD + search + auto-numbering
    │   ├── servlet/
    │   │   ├── InvoiceServlet.java     ← REST-style AJAX endpoint
    │   │   ├── CustomerServlet.java    ← REST-style AJAX endpoint
    │   │   ├── AppContextListener.java ← Hibernate init/shutdown
    │   │   ├── CORSFilter.java
    │   │   └── EncodingFilter.java
    │   └── util/
    │       └── HibernateUtil.java      ← Thread-safe SessionFactory singleton
    ├── resources/
    │   └── hibernate.cfg.xml           ← DB connection + entity mappings
    └── webapp/
        ├── index.html                  ← Single-page application shell
        ├── css/style.css               ← Full design system
        ├── js/
        │   ├── api.js                  ← AJAX abstraction layer
        │   └── app.js                  ← Full SPA logic
        └── WEB-INF/web.xml
```

---

## Prerequisites

- Java JDK 11+
- Maven 3.6+
- MySQL 8.0+
- Apache Tomcat 9.x

---

## Setup Instructions

### 1. Configure MySQL

```bash
mysql -u root -p
```

```sql
CREATE DATABASE invoicing_db;
SOURCE /path/to/invoicing-system/sql/schema.sql;
```

### 2. Configure Hibernate

Edit `src/main/resources/hibernate.cfg.xml`:

```xml
<property name="hibernate.connection.url">
    jdbc:mysql://localhost:3306/invoicing_db?useSSL=false&serverTimezone=UTC
</property>
<property name="hibernate.connection.username">root</property>
<property name="hibernate.connection.password">YOUR_PASSWORD</property>
```

### 3. Build the WAR

```bash
cd invoicing-system
mvn clean package
```

This produces `target/invoicing-system.war`.

### 4. Deploy to Tomcat

Copy the WAR to Tomcat's webapps directory:

```bash
cp target/invoicing-system.war $TOMCAT_HOME/webapps/
```

Start Tomcat:

```bash
$TOMCAT_HOME/bin/startup.sh
```

### 5. Open the App

Navigate to: **http://localhost:8080/invoicing-system/**

---

## API Reference

All endpoints return JSON and consume JSON.

### Invoices — `/api/invoices`

| Method   | URL                          | Description              |
|----------|------------------------------|--------------------------|
| `GET`    | `/api/invoices`              | List all invoices        |
| `GET`    | `/api/invoices?id=1`         | Get single invoice       |
| `GET`    | `/api/invoices?q=alice`      | Search invoices          |
| `GET`    | `/api/invoices/next-number`  | Generate next INV number |
| `POST`   | `/api/invoices`              | Create invoice           |
| `PUT`    | `/api/invoices`              | Update invoice           |
| `DELETE` | `/api/invoices?id=1`         | Delete invoice           |

**Create/Update Payload Example:**
```json
{
  "customerId": 1,
  "issueDate": "2026-02-21",
  "dueDate": "2026-03-21",
  "status": "SENT",
  "taxRate": 10,
  "notes": "Payment due within 30 days",
  "items": [
    { "description": "Web Design", "quantity": 1, "unitPrice": 1500.00 },
    { "description": "Hosting (monthly)", "quantity": 12, "unitPrice": 25.00 }
  ]
}
```

### Customers — `/api/customers`

| Method   | URL                         | Description          |
|----------|-----------------------------|----------------------|
| `GET`    | `/api/customers`            | List all customers   |
| `GET`    | `/api/customers?id=1`       | Get single customer  |
| `GET`    | `/api/customers?q=alice`    | Search customers     |
| `POST`   | `/api/customers`            | Create customer      |
| `PUT`    | `/api/customers`            | Update customer      |
| `DELETE` | `/api/customers?id=1`       | Delete customer      |

---

## Key Features

### ✅ CRUD Operations
- Create, read, update, delete invoices and customers
- Auto-generated invoice numbers (INV-YYYY-NNNN)
- Cascade delete (deleting a customer removes their invoices)

### ✅ Hibernate ORM
- All DB operations use Hibernate Session (not raw SQL)
- `@Entity`, `@Table`, `@Column`, `@ManyToOne`, `@OneToMany`, `@Enumerated` annotations
- HQL queries for search
- `@PrePersist` / `@PreUpdate` lifecycle hooks
- Thread-safe `SessionFactory` singleton via `HibernateUtil`

### ✅ AJAX Integration
- No page reloads — all data loaded/submitted via `fetch()`
- Real-time feedback with toast notifications
- Debounced live search (300ms)
- Loading/error states on every async operation

### ✅ Form Validation
- Client-side: instant field error messages before submission
- Server-side: validation in servlets with structured error responses
- Both layers return consistent error arrays

### ✅ Invoice Management
- Line items with auto-calculated totals
- Tax rate with live subtotal / tax / grand total preview
- Status workflow: Draft → Sent → Paid / Overdue / Cancelled
- Print / PDF via browser print dialog
- Date pickers via Flatpickr

### ✅ Search (Bonus Feature)
- Invoices: search by invoice number, customer name, or status
- Customers: search by name or email
- Results update in real-time with 300ms debounce

---

## Learning Outcomes Addressed

| LO | Description | Implementation |
|----|-------------|----------------|
| LO 2 | Connect JSP/Servlets with databases | `InvoiceServlet`, `CustomerServlet` → Hibernate DAOs |
| LO 3 | Hibernate Framework | `Customer`, `Invoice`, `InvoiceItem` entities; `HibernateUtil`; HQL queries |
| LO 6 | JavaScript in web apps | `app.js` (2000+ lines): SPA routing, DOM manipulation, form validation |
| LO 7 | AJAX for dynamic web apps | `api.js` abstraction layer; all CRUD via `fetch()`; no page reloads |

---

## Troubleshooting

**Hibernate fails to start?**
- Verify MySQL is running: `mysql -u root -p`
- Check username/password in `hibernate.cfg.xml`
- Ensure `invoicing_db` database exists

**404 on API calls?**
- Make sure Tomcat deployed correctly and WAR is expanded
- Check Tomcat logs: `$TOMCAT_HOME/logs/catalina.out`

**`hbm2ddl.auto=update` not creating tables?**
- Try `create` on first run, then switch back to `update`
- Alternatively, run `sql/schema.sql` manually
