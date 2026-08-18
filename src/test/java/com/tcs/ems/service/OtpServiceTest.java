package com.tcs.ems.service;

import com.tcs.ems.dto.VerifyOtpRequest;
import com.tcs.ems.entity.User;
import com.tcs.ems.exception.InvalidOtpException;
import com.tcs.ems.exception.MaxOtpAttemptsExceededException;
import com.tcs.ems.exception.OtpExpiredException;
import com.tcs.ems.exception.UserNotFoundException;
import com.tcs.ems.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OtpService otpService;

    private User sampleUser;
    private VerifyOtpRequest verifyRequest;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1)
                .name("Alice Smith")
                .email("alice@tcs.com")
                .password("hashedPassword")
                .role("ROLE_USER")
                .verified(false)
                .otpHash("hashedOtp")
                .otpExpiryTime(LocalDateTime.now().plusMinutes(5))
                .otpAttempts(0)
                .lastOtpRequestTime(LocalDateTime.now().minusMinutes(2))
                .build();

        verifyRequest = new VerifyOtpRequest("alice@tcs.com", "123456");
    }

    @Test
    @DisplayName("Should verify OTP successfully when valid")
    void verifyOtp_Success() {
        when(userRepository.findByEmail("alice@tcs.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("123456", "hashedOtp")).thenReturn(true);

        String result = otpService.verifyOtp(verifyRequest);

        assertTrue(result.contains("verified successfully"));
        assertTrue(sampleUser.isVerified());
        assertNull(sampleUser.getOtpHash());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Should throw InvalidOtpException on wrong OTP and increment attempts")
    void verifyOtp_WrongOtp() {
        when(userRepository.findByEmail("alice@tcs.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("123456", "hashedOtp")).thenReturn(false);

        assertThrows(InvalidOtpException.class, () -> otpService.verifyOtp(verifyRequest));
        assertEquals(1, sampleUser.getOtpAttempts());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Should throw OtpExpiredException when OTP time expired")
    void verifyOtp_Expired() {
        sampleUser.setOtpExpiryTime(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByEmail("alice@tcs.com")).thenReturn(Optional.of(sampleUser));

        assertThrows(OtpExpiredException.class, () -> otpService.verifyOtp(verifyRequest));
    }

    @Test
    @DisplayName("Should throw MaxOtpAttemptsExceededException when attempts reach limit")
    void verifyOtp_MaxAttempts() {
        sampleUser.setOtpAttempts(3);
        when(userRepository.findByEmail("alice@tcs.com")).thenReturn(Optional.of(sampleUser));

        assertThrows(MaxOtpAttemptsExceededException.class, () -> otpService.verifyOtp(verifyRequest));
    }
}
