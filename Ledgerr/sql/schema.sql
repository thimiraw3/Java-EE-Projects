-- ============================================
-- Invoicing System Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS invoicing_db;
USE invoicing_db;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    phone       VARCHAR(20),
    address     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number  VARCHAR(50) NOT NULL UNIQUE,
    customer_id     INT NOT NULL,
    issue_date      DATE NOT NULL,
    due_date        DATE NOT NULL,
    status          ENUM('DRAFT','SENT','PAID','OVERDUE','CANCELLED') DEFAULT 'DRAFT',
    notes           TEXT,
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id  INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    line_total  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Sample Data
INSERT INTO customers (name, email, phone, address) VALUES
('Alice Johnson',  'alice@example.com',  '+1-555-0101', '123 Maple St, Springfield, IL 62701'),
('Bob Williams',   'bob@example.com',    '+1-555-0102', '456 Oak Ave, Columbus, OH 43215'),
('Carol Martinez', 'carol@example.com',  '+1-555-0103', '789 Pine Rd, Austin, TX 73301'),
('David Lee',      'david@example.com',  '+1-555-0104', '321 Elm Blvd, Seattle, WA 98101');
