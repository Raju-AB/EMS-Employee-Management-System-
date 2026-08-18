package com.tcs.ems.service;

import com.tcs.ems.dto.EmployeeRequestDTO;
import com.tcs.ems.dto.EmployeeResponseDTO;
import com.tcs.ems.dto.PagedResponseDTO;
import com.tcs.ems.entity.Employee;
import com.tcs.ems.exception.DuplicateEmployeeException;
import com.tcs.ems.exception.EmployeeNotFoundException;
import com.tcs.ems.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto) {
        if (employeeRepository.existsById(dto.getEmail())) {
            throw new DuplicateEmployeeException("Employee with email '" + dto.getEmail() + "' already exists");
        }

        Employee employee = Employee.builder()
                .email(dto.getEmail())
                .name(dto.getName())
                .salary(dto.getSalary())
                .dept(dto.getDept())
                .build();

        Employee saved = employeeRepository.save(employee);
        return mapToResponseDTO(saved);
    }

    public EmployeeResponseDTO findByEmployee(String email) {
        Employee employee = employeeRepository.findById(email)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with email: " + email));
        return mapToResponseDTO(employee);
    }

    public List<EmployeeResponseDTO> findAllEmployee() {
        return employeeRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public PagedResponseDTO<EmployeeResponseDTO> getEmployeesPaginated(
            int page, int size, String sortBy, String direction, String search, String dept) {

        Sort sort = direction.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Employee> employeePage = employeeRepository.searchEmployees(search, dept, pageable);

        List<EmployeeResponseDTO> content = employeePage.getContent().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());

        return PagedResponseDTO.<EmployeeResponseDTO>builder()
                .content(content)
                .pageNo(employeePage.getNumber())
                .pageSize(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .last(employeePage.isLast())
                .build();
    }

    @Transactional
    public EmployeeResponseDTO updateById(String email, EmployeeRequestDTO dto) {
        Employee existing = employeeRepository.findById(email)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with email: " + email));

        existing.setName(dto.getName());
        existing.setSalary(dto.getSalary());
        existing.setDept(dto.getDept());

        Employee updated = employeeRepository.save(existing);
        return mapToResponseDTO(updated);
    }

    @Transactional
    public String deleteById(String email) {
        if (!employeeRepository.existsById(email)) {
            throw new EmployeeNotFoundException("Employee not found with email: " + email);
        }
        employeeRepository.deleteById(email);
        return "Employee deleted successfully";
    }

    @Transactional
    public String deleteAll() {
        employeeRepository.deleteAll();
        return "All employee records purged successfully";
    }

    public List<String> getAllDepartments() {
        return employeeRepository.findAllDepartments();
    }

    private EmployeeResponseDTO mapToResponseDTO(Employee employee) {
        return EmployeeResponseDTO.builder()
                .email(employee.getEmail())
                .name(employee.getName())
                .salary(employee.getSalary())
                .dept(employee.getDept())
                .build();
    }
}