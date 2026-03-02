package com.ems.services;

import com.ems.entities.Employee;
import com.ems.config.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EmployeeService {


    public Employee createEmployee(Employee employee) {
        Transaction tx = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            tx = session.beginTransaction();
            session.save(employee);
            tx.commit();
            return employee;
        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error creating employee: " + e.getMessage());
        }
    }

    public Map<String, Object> getEmployees(
            String name,
            String position,
            String department,
            String hireDateStr,
            String statusStr,
            int page,
            int size) {

        LocalDate hireDate = null;
        Employee.EmployeeStatus status = null;

        if (hireDateStr != null) hireDate = LocalDate.parse(hireDateStr);


        if (statusStr != null) status = Employee.EmployeeStatus.valueOf(statusStr.toUpperCase());

        List<Employee> employees;
        long total;

        boolean isSearch = name != null || position != null || department != null || hireDate != null || status != null;

        if (isSearch) {
            employees = searchEmployees(name, position, department, hireDate, status, page, size);
            total = countSearchResults(name, position, department, hireDate, status);
        } else {

            employees = getAllEmployees(page, size);
            total = countAllEmployees();
        }

        Map<String, Object> response = new HashMap<>();

        response.put("data", employees);
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", (int) Math.ceil((double) total / size)
        );

        return response;
    }


    public List<Employee> getAllEmployees(int page, int size) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<Employee> query = session.createQuery("FROM Employee ORDER BY name", Employee.class);
            query.setFirstResult((page - 1) * size);
            query.setMaxResults(size);
            return query.list();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching employees: " + e.getMessage());
        }
    }

    public long countAllEmployees() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("SELECT COUNT(e) FROM Employee e", Long.class).uniqueResult();
        }
    }

    public Employee getEmployeeById(Long id) {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Employee employee = session.get(Employee.class, id);

            if (employee == null) {
                throw new RuntimeException("Employee not found");
            }

            return employee;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching employee: " + e.getMessage());
        }
    }

    public Employee updateEmployee(Long id, Employee data) {

        validateEmployee(data);
        Transaction tx = null;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            tx = session.beginTransaction();
            Employee emp = session.get(Employee.class, id);

            if (emp == null) {
                throw new RuntimeException("Employee not found");
            }

            emp.setName(data.getName());
            emp.setPosition(data.getPosition());
            emp.setDepartment(data.getDepartment());
            emp.setHireDate(data.getHireDate());
            emp.setSalary(data.getSalary());
            emp.setEmail(data.getEmail());
            emp.setPhone(data.getPhone());
            emp.setStatus(data.getStatus());

            session.update(emp);
            tx.commit();
            return emp;

        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException(e.getMessage());
        }
    }

    public void deleteEmployee(Long id) {

        Transaction tx = null;

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            tx = session.beginTransaction();
            Employee emp = session.get(Employee.class, id);

            if (emp == null) {
                throw new RuntimeException("Employee not found");
            }
            session.delete(emp);
            tx.commit();

        } catch (Exception e) {
            if (tx != null) tx.rollback();
            throw new RuntimeException("Error deleting employee: " + e.getMessage());
        }
    }


    private List<Employee> searchEmployees(
            String name,
            String position,
            String department,
            LocalDate hireDate,
            Employee.EmployeeStatus status,
            int page, int size) {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {

            StringBuilder hql = new StringBuilder("FROM Employee e WHERE 1=1");
            Map<String, Object> params = new HashMap<>();


            if (name != null && !name.isBlank()) {
                hql.append(" AND LOWER(e.name) LIKE :name");
                params.put("name", "%" + name.toLowerCase() + "%");
            }
            if (position != null && !position.isBlank()) {
                hql.append(" AND LOWER(e.position) LIKE :position");
                params.put("position", "%" + position.toLowerCase() + "%");
            }
            if (department != null && !department.isBlank()) {
                hql.append(" AND LOWER(e.department) LIKE :department");
                params.put("department", "%" + department.toLowerCase() + "%");
            }
            if (hireDate != null) {
                hql.append(" AND e.hireDate = :hireDate");
                params.put("hireDate", hireDate);
            }
            if (status != null) {
                hql.append(" AND e.status = :status");
                params.put("status", status);
            }

            Query<Employee> query = session.createQuery(hql.toString(), Employee.class);
            params.forEach(query::setParameter);
            query.setFirstResult((page - 1) * size);
            query.setMaxResults(size);

            return query.list();
        } catch (Exception e) {
            throw new RuntimeException("Error searching employees: " + e.getMessage());
        }
    }


    private long countSearchResults(
            String name,
            String position,
            String department,
            LocalDate hireDate,
            Employee.EmployeeStatus status) {

        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            StringBuilder hql = new StringBuilder("SELECT COUNT(e) FROM Employee e WHERE 1=1");
            Map<String, Object> params = new HashMap<>();

            if (name != null && !name.isBlank()) {
                hql.append(" AND LOWER(e.name) LIKE :name");
                params.put("name", "%" + name.toLowerCase() + "%");
            }
            if (position != null && !position.isBlank()) {
                hql.append(" AND LOWER(e.position) LIKE :position");
                params.put("position", "%" + position.toLowerCase() + "%");
            }
            if (department != null && !department.isBlank()) {
                hql.append(" AND LOWER(e.department) LIKE :department");
                params.put("department", "%" + department.toLowerCase() + "%");
            }
            if (hireDate != null) {
                hql.append(" AND e.hireDate = :hireDate");
                params.put("hireDate", hireDate);
            }
            if (status != null) {
                hql.append(" AND e.status = :status");
                params.put("status", status);
            }

            Query<Long> query = session.createQuery(hql.toString(), Long.class);
            params.forEach(query::setParameter);
            return query.uniqueResult();
        }
    }


    public Map<String, Object> getDashboardStats() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Map<String, Object> stats = new HashMap<>();

            // Total employees
            long total = (long) session.createQuery("SELECT COUNT(e) FROM Employee e").uniqueResult();
            stats.put("totalEmployees", total);

            // Active employees
            long active = (long) session.createQuery(
                    "SELECT COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE'").uniqueResult();
            stats.put("activeEmployees", active);

            // Average salary
            Double avgSalary = (Double) session.createQuery(
                    "SELECT AVG(e.salary) FROM Employee e").uniqueResult();
            stats.put("averageSalary", avgSalary != null ? avgSalary : 0.0);

            // Department counts
            List<?> deptCounts = session.createQuery(
                    "SELECT e.department, COUNT(e) FROM Employee e GROUP BY e.department ORDER BY COUNT(e) DESC"
            ).list();
            stats.put("departmentCounts", deptCounts);

            // Recent hires
            long recentHires = (long) session.createQuery(
                    "SELECT COUNT(e) FROM Employee e WHERE e.hireDate >= :date"
            ).setParameter("date", LocalDate.now().minusDays(30)).uniqueResult();
            stats.put("recentHires", recentHires);

            return stats;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching stats: " + e.getMessage());
        }
    }

    public List<String> getAllDepartments() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("SELECT DISTINCT e.department FROM Employee e", String.class).list();
        }
    }

    public List<String> getAllPositions() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("SELECT DISTINCT e.position FROM Employee e", String.class).list();
        }
    }

    private void validateEmployee(Employee e) {

        if (e == null)
            throw new RuntimeException("Employee required");

        if (e.getName() == null || e.getName().isBlank())
            throw new RuntimeException("Name required");

        if (e.getPosition() == null)
            throw new RuntimeException("Position required");

        if (e.getDepartment() == null)
            throw new RuntimeException("Department required");


        if (e.getHireDate() == null)
            throw new RuntimeException("HireDate required");


        if (e.getSalary() == null || e.getSalary().doubleValue() <= 0)
            throw new RuntimeException("Salary required");
    }

}