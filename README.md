# EmpSphere — Enterprise Employee Management System (EMS)

EmpSphere is a clean, secure, and interview-ready **Java Full Stack Application** built with **Java 21**, **Spring Boot 3.4.2**, **Spring Security 6**, **Spring Data JPA**, **MySQL**, and a responsive **HTML5/CSS3/JavaScript** frontend.

The system features stateless **JWT authentication**, **BCrypt password hashing**, a hardened **email OTP verification engine**, **DTO-driven API architecture**, **server-side pagination**, and interactive **OpenAPI (Swagger UI)** documentation.

---

## 🌟 Key Features

### 🔐 Security & Identity Management
- **Stateless JWT Authentication**: Secure login issuing signed JJWT tokens (0.12.6) passed in `Authorization: Bearer <token>` headers.
- **BCrypt Encryption**: One-way cryptographic hashing for passwords and OTP codes.
- **Role-Based Access Control (RBAC)**:
  - `ROLE_ADMIN`: Full CRUD privileges (Create, Read, Update, Delete employees).
  - `ROLE_USER`: Read-only access to workforce records.
- **Hardened Email OTP Engine**:
  - `SecureRandom` 6-digit OTP generation.
  - BCrypt hashed OTP database storage.
  - 5-minute expiration window.
  - 3 maximum verification attempt limit.
  - 60-second resend cooldown.

### 💼 Employee Management
- **Complete CRUD Operations**: Create, view, update, and delete workforce records.
- **Server-Side Pagination & Filtering**: Spring Data `Pageable` queries with configurable page sizes (5, 10, 25), multi-field search (name/email), department filtering, and dynamic sorting (name/salary).

### 🛠️ Architecture & Quality
- **Clean Layered Architecture**: Controller → DTO → Service → Repository → Entity → Database.
- **Jakarta Validation**: Input data validation via `@NotBlank`, `@Email`, `@Positive`, `@Size`.
- **Global Exception Handling**: Centralized `@RestControllerAdvice` returning uniform `ErrorResponse` JSON payloads.
- **Interactive Swagger UI**: API documentation at `/swagger-ui.html` with Bearer authentication support.
- **Automated Testing**: 12 automated JUnit 5 and Mockito tests with a 100% pass rate.

---

## 🛠️ Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Backend Language** | Java 21 |
| **Framework** | Spring Boot 3.4.2 |
| **Security** | Spring Security 6, JJWT 0.12.6, BCrypt |
| **Persistence** | Spring Data JPA, Hibernate ORM, MySQL |
| **Validation** | Jakarta Bean Validation |
| **Documentation** | SpringDoc OpenAPI 2.8.5 (Swagger UI) |
| **Testing** | JUnit 5, Mockito, Spring Boot Test |
| **Frontend** | Vanilla HTML5, CSS3 (Dark/Light mode), JavaScript (ES6 Fetch API, LocalStorage) |
| **Build Tool** | Apache Maven |

---

## 📂 Project Architecture & Package Structure

```text
com.tcs.ems
├── EmsApplication.java
├── config          # SecurityConfig (JWT Filter, CORS, RBAC), OpenApiConfig
├── controller      # AuthController, UserController, EmployeeController
├── dto             # Request/Response DTOs & PagedResponseDTO
├── entity          # User & Employee JPA Entities
├── exception       # Custom Exceptions & GlobalExceptionHandling (@RestControllerAdvice)
├── repository     # UserRepository, EmployeeRepository (JPQL Paginated Queries)
├── security        # JwtUtils, JwtAuthenticationFilter, CustomUserDetailsService
├── service         # UserService, OtpService, EmployeeService, EmailService
└── util            # OtpGenarator (SecureRandom)
```

---

## 🚀 Getting Started

### Prerequisites
- **JDK 21** or higher
- **Maven 3.8+**
- **MySQL Server 8.0+**

### 1. Database Configuration
Create a MySQL database named `ems_db`:
```sql
CREATE DATABASE IF NOT EXISTS ems_db;
```

Update `src/main/resources/application.properties` with your database credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ems_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password

jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration.ms=86400000
```

### 2. Run Automated Tests
```bash
.\mvnw.cmd clean test
```

### 3. Start the Application
```bash
.\mvnw.cmd spring-boot:run
```

The application will start on **`http://localhost:8088`**.

---

## 🌐 API & Documentation Links

- **Web Dashboard**: `http://localhost:8088/`
- **Swagger UI Documentation**: `http://localhost:8088/swagger-ui.html`

---

## 📑 Core REST APIs

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & issue Bearer JWT | Public |
| `POST` | `/users/register` | Register user & send 6-digit OTP | Public |
| `POST` | `/users/verify-otp` | Verify OTP code & activate user account | Public |
| `POST` | `/users/resend-otp` | Resend 6-digit OTP (60s cooldown) | Public |
| `GET` | `/employees` | Server-side paginated & filtered employees | `ADMIN` / `USER` |
| `POST` | `/employees` | Create a new employee record | `ROLE_ADMIN` |
| `PUT` | `/employees/{email}` | Update existing employee record | `ROLE_ADMIN` |
| `DELETE`| `/employees/{email}` | Delete employee record by email | `ROLE_ADMIN` |

---

## 📜 License
This project is open-source under the MIT License.
