package com.tcs.ems.repository;

import com.tcs.ems.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    @Query("SELECT e FROM Employee e WHERE " +
           "(:dept IS NULL OR :dept = '' OR LOWER(e.dept) = LOWER(:dept)) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchEmployees(@Param("search") String search, @Param("dept") String dept, Pageable pageable);

    @Query("SELECT DISTINCT e.dept FROM Employee e ORDER BY e.dept ASC")
    List<String> findAllDepartments();
}
