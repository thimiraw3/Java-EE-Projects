# Ledgerr 🧾

A lightweight invoicing web application built with Java, JAX-RS, Hibernate, and a vanilla JS frontend. Ledgerr lets you manage customers and invoices from a clean single-page dashboard.

---

## Features

- **Dashboard** — at-a-glance overview of invoice activity
- **Invoice management** — create, view, search, and update invoices with auto-generated invoice numbers
- **Customer management** — maintain a client list with contact details
- **Line items** — add multiple items per invoice with automatic subtotal, tax, and total calculations
- **Invoice statuses** — track invoices through `DRAFT → SENT → PAID / OVERDUE / CANCELLED`
- **Print-ready** — built-in print view for each invoice

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 25, JAX-RS 3.1 (Jersey 3), Hibernate 6 |
| Server | Embedded Apache Tomcat 11 |
| Database | MySQL 8+ |
| Serialization | Jackson 2.15 |
| Frontend | Vanilla JS, HTML5, CSS3 |
| Build | Maven |

---

## Prerequisites

- Java 25+
- Maven 3.9+
- MySQL 8+

---

## Getting Started

### 1. Set up the database

```sql
mysql -u root -p < sql/schema.sql
```

This creates the `invoicing_db` database, all tables, and loads sample customer data.

### 2. Configure the database connection

Edit `src/main/resources/hibernate.cfg.xml` and update the connection properties:

```xml
<property name="hibernate.connection.url">jdbc:mysql://localhost:3306/invoicing_db</property>
<property name="hibernate.connection.username">your_username</property>
<property name="hibernate.connection.password">your_password</property>
```

### 3. Build and run

```bash
mvn clean package
mvn exec:java -Dexec.mainClass="com.invoicing.Main"
```

The app starts on **http://localhost:8080** by default.

---

## Project Structure

```
Ledgerr/
├── sql/
│   └── schema.sql                  # Database schema & seed data
├── src/main/
│   ├── java/com/invoicing/
│   │   ├── Main.java               # Entry point, embedded Tomcat setup
│   │   ├── config/                 # Jersey & CORS configuration
│   │   ├── controller/             # REST endpoints (invoices, customers)
│   │   ├── dao/                    # Data access layer (Hibernate)
│   │   ├── dto/                    # Request/response DTOs
│   │   ├── model/                  # JPA entities (Invoice, Customer, InvoiceItem)
│   │   ├── service/                # Business logic & validation
│   │   └── util/                   # HibernateUtil session factory
│   ├── resources/
│   │   └── hibernate.cfg.xml       # DB connection & Hibernate settings
│   └── webapp/
│       ├── index.html              # Single-page app shell
│       ├── css/style.css           # Application styles
│       └── js/
│           ├── app.js              # UI logic, navigation, modals
│           ├── api.js              # Fetch wrapper for REST calls
│           └── script.js           # Utility functions
└── pom.xml
```

---

## API Endpoints

### Invoices — `/api/invoices`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/invoices` | List all invoices |
| `GET` | `/api/invoices/{id}` | Get invoice by ID |
| `GET` | `/api/invoices/search?q=` | Search invoices |
| `GET` | `/api/invoices/next-number` | Generate next invoice number |
| `POST` | `/api/invoices` | Create a new invoice |
| `PUT` | `/api/invoices/{id}` | Update an invoice |
| `DELETE` | `/api/invoices/{id}` | Delete an invoice |

### Customers — `/api/customers`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/customers` | List all customers |
| `GET` | `/api/customers/{id}` | Get customer by ID |
| `POST` | `/api/customers` | Create a new customer |
| `PUT` | `/api/customers/{id}` | Update a customer |
| `DELETE` | `/api/customers/{id}` | Delete a customer |

---

## Database Schema

```
customers        invoices              invoice_items
─────────        ────────              ─────────────
id               id                    id
name             invoice_number        invoice_id → invoices.id
email            customer_id → customers.id
phone            issue_date            description
address          due_date              quantity
created_at       status                unit_price
                 notes                 line_total
                 subtotal
                 tax_rate
                 tax_amount
                 total_amount
                 created_at / updated_at
```

---

## License

MIT
