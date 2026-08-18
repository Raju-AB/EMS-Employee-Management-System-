package com.tcs.ems.controller;

import com.tcs.ems.dto.EmployeeRequestDTO;
import com.tcs.ems.dto.EmployeeResponseDTO;
import com.tcs.ems.dto.PagedResponseDTO;
import com.tcs.ems.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employees")
@Tag(name = "Employee Management", description = "Protected endpoints for Employee CRUD, Pagination, Search, and Filtering")
@SecurityRequirement(name = "Bearer Authentication")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    @Operation(summary = "Create New Employee", description = "Adds a new employee to the database. Requires ADMIN role.")
    public ResponseEntity<EmployeeResponseDTO> createEmployee(@Valid @RequestBody EmployeeRequestDTO dto) {
        EmployeeResponseDTO created = employeeService.createEmployee(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{email}")
    @Operation(summary = "Find Employee by Email", description = "Retrieves specific employee details by email address.")
    public ResponseEntity<EmployeeResponseDTO> findByEmployee(@PathVariable String email) {
        EmployeeResponseDTO employee = employeeService.findByEmployee(email);
        return ResponseEntity.ok(employee);
    }

    @GetMapping
    @Operation(summary = "Get Paginated & Filtered Employees", description = "Retrieves a paginated list of employees with optional search keyword, department filter, and sorting.")
    public ResponseEntity<PagedResponseDTO<EmployeeResponseDTO>> getEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dept) {

        PagedResponseDTO<EmployeeResponseDTO> result = employeeService.getEmployeesPaginated(page, size, sortBy, direction, search, dept);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    @Operation(summary = "Get All Employees (Unpaginated)", description = "Retrieves all employee records without pagination.")
    public ResponseEntity<List<EmployeeResponseDTO>> findAllEmployee() {
        List<EmployeeResponseDTO> list = employeeService.findAllEmployee();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/departments")
    @Operation(summary = "Get All Departments", description = "Retrieves a unique list of active department names.")
    public ResponseEntity<List<String>> getAllDepartments() {
        List<String> depts = employeeService.getAllDepartments();
        return ResponseEntity.ok(depts);
    }

    @PutMapping("/{email}")
    @Operation(summary = "Update Employee", description = "Updates existing employee record. Requires ADMIN role.")
    public ResponseEntity<EmployeeResponseDTO> updateEmployee(
            @PathVariable String email,
            @Valid @RequestBody EmployeeRequestDTO dto) {
        EmployeeResponseDTO updated = employeeService.updateById(email, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{email}")
    @Operation(summary = "Delete Employee by Email", description = "Deletes an employee record by email. Requires ADMIN role.")
    public ResponseEntity<Map<String, String>> deleteEmployeeById(@PathVariable String email) {
        String message = employeeService.deleteById(email);
        return ResponseEntity.ok(Map.of("message", message, "status", "success"));
    }

    @DeleteMapping
    @Operation(summary = "Delete All Employees", description = "Purges all employee records from the database. Requires ADMIN role.")
    public ResponseEntity<Map<String, String>> deleteAll() {
        String message = employeeService.deleteAll();
        return ResponseEntity.ok(Map.of("message", message, "status", "success"));
    }
}