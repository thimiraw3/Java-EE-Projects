-- ============================================================
-- Employee Management System - MySQL Setup Script
-- Run this before starting the application
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS employee_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE employee_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE,
    role ENUM('ADMIN', 'USER') DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(12, 2) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    status ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data (optional)
INSERT INTO employees (name, position, department, hire_date, salary, email, status) VALUES
('Alice Johnson', 'Senior Software Engineer', 'Engineering', '2021-03-15', 95000.00, 'alice@company.com', 'ACTIVE'),
('Bob Martinez', 'Product Manager', 'Product', '2020-07-01', 105000.00, 'bob@company.com', 'ACTIVE'),
('Carol Williams', 'UX Designer', 'Design', '2022-01-10', 78000.00, 'carol@company.com', 'ACTIVE'),
('David Chen', 'DevOps Engineer', 'Engineering', '2019-11-22', 98000.00, 'david@company.com', 'ACTIVE'),
('Eva Nguyen', 'Data Analyst', 'Analytics', '2023-02-14', 72000.00, 'eva@company.com', 'ACTIVE'),
('Frank Brown', 'QA Engineer', 'Engineering', '2021-09-05', 68000.00, 'frank@company.com', 'INACTIVE'),
('Grace Kim', 'Marketing Manager', 'Marketing', '2020-04-18', 88000.00, 'grace@company.com', 'ACTIVE'),
('Henry Davis', 'Backend Developer', 'Engineering', '2022-06-30', 87000.00, 'henry@company.com', 'ON_LEAVE'),
('Iris Thompson', 'Frontend Developer', 'Engineering', '2023-08-01', 82000.00, 'iris@company.com', 'ACTIVE'),
('Jack Wilson', 'HR Manager', 'Human Resources', '2018-12-03', 82000.00, 'jack@company.com', 'ACTIVE');

SELECT 'Database setup complete!' AS status;
