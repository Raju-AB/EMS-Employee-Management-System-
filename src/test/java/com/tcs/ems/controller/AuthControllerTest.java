package com.tcs.ems.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcs.ems.dto.LoginRequest;
import com.tcs.ems.entity.User;
import com.tcs.ems.repository.UserRepository;
import com.tcs.ems.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private JwtUtils jwtUtils;

    @Autowired
    private MockMvc mockMvc;

    private User verifiedUser;

    @BeforeEach
    void setUp() {
        verifiedUser = User.builder()
                .id(1)
                .name("Admin User")
                .email("admin@tcs.com")
                .password("encodedPassword")
                .role("ROLE_ADMIN")
                .verified(true)
                .build();
    }

    @Test
    @DisplayName("Should login successfully and return JWT token")
    void login_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@tcs.com", "password123");

        when(userRepository.findByEmail("admin@tcs.com")).thenReturn(Optional.of(verifiedUser));

        Authentication auth = new UsernamePasswordAuthenticationToken(verifiedUser.getEmail(), null);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtUtils.generateJwtToken(any())).thenReturn("mocked.jwt.token");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.email").value("admin@tcs.com"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }
}
