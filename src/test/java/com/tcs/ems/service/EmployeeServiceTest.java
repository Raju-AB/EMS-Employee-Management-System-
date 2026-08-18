package com.tcs.ems.service;

import com.tcs.ems.dto.EmployeeRequestDTO;
import com.tcs.ems.dto.EmployeeResponseDTO;
import com.tcs.ems.dto.PagedResponseDTO;
import com.tcs.ems.entity.Employee;
import com.tcs.ems.exception.DuplicateEmployeeException;
import com.tcs.ems.exception.EmployeeNotFoundException;
import com.tcs.ems.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee sampleEmployee;
    private EmployeeRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        sampleEmployee = Employee.builder()
                .email("john.doe@tcs.com")
                .name("John Doe")
                .salary(75000.0)
                .dept("Engineering")
                .build();

        requestDTO = EmployeeRequestDTO.builder()
                .email("john.doe@tcs.com")
                .name("John Doe")
                .salary(75000.0)
                .dept("Engineering")
                .build();
    }

    @Test
    @DisplayName("Should create employee successfully when email does not exist")
    void createEmployee_Success() {
        when(employeeRepository.existsById("john.doe@tcs.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenReturn(sampleEmployee);

        EmployeeResponseDTO response = employeeService.createEmployee(requestDTO);

        assertNotNull(response);
        assertEquals("john.doe@tcs.com", response.getEmail());
        assertEquals("John Doe", response.getName());
        verify(employeeRepository, times(1)).save(any(Employee.class));
    }

    @Test
    @DisplayName("Should throw DuplicateEmployeeException when creating duplicate employee")
    void createEmployee_DuplicateError() {
        when(employeeRepository.existsById("john.doe@tcs.com")).thenReturn(true);

        assertThrows(DuplicateEmployeeException.class, () -> employeeService.createEmployee(requestDTO));
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    @DisplayName("Should return employee by email")
    void findByEmployee_Success() {
        when(employeeRepository.findById("john.doe@tcs.com")).thenReturn(Optional.of(sampleEmployee));

        EmployeeResponseDTO response = employeeService.findByEmployee("john.doe@tcs.com");

        assertNotNull(response);
        assertEquals("John Doe", response.getName());
    }

    @Test
    @DisplayName("Should throw EmployeeNotFoundException when email not found")
    void findByEmployee_NotFound() {
        when(employeeRepository.findById("missing@tcs.com")).thenReturn(Optional.empty());

        assertThrows(EmployeeNotFoundException.class, () -> employeeService.findByEmployee("missing@tcs.com"));
    }

    @Test
    @DisplayName("Should return paginated employees")
    void getEmployeesPaginated_Success() {
        Page<Employee> page = new PageImpl<>(List.of(sampleEmployee));
        when(employeeRepository.searchEmployees(any(), any(), any(Pageable.class))).thenReturn(page);

        PagedResponseDTO<EmployeeResponseDTO> result = employeeService.getEmployeesPaginated(0, 10, "name", "asc", null, null);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("John Doe", result.getContent().get(0).getName());
    }

    @Test
    @DisplayName("Should delete employee successfully when exists")
    void deleteById_Success() {
        when(employeeRepository.existsById("john.doe@tcs.com")).thenReturn(true);

        String result = employeeService.deleteById("john.doe@tcs.com");

        assertEquals("Employee deleted successfully", result);
        verify(employeeRepository, times(1)).deleteById("john.doe@tcs.com");
    }
}
