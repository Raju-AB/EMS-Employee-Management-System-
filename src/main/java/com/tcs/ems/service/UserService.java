package com.tcs.ems.service;

import com.tcs.ems.dto.RegisterRequest;
import com.tcs.ems.entity.User;
import com.tcs.ems.exception.UserAlreadyExistsException;
import com.tcs.ems.repository.UserRepository;
import com.tcs.ems.util.OtpGenarator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, EmailService emailService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + registerRequest.getEmail() + " already exists");
        }

        String rawOtp = OtpGenarator.generateOtp();
        String hashedOtp = passwordEncoder.encode(rawOtp);

        String role = registerRequest.getRole();
        if (role == null || role.isBlank()) {
            role = "ROLE_USER";
        } else if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase();
        }

        User user = User.builder()
                .name(registerRequest.getName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(role)
                .verified(false)
                .otpHash(hashedOtp)
                .otpExpiryTime(LocalDateTime.now().plusMinutes(5))
                .otpAttempts(0)
                .lastOtpRequestTime(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Send raw OTP via email
        emailService.sendOtp(user.getEmail(), rawOtp);

        return "User registered successfully. Please check your email for the 6-digit OTP code.";
    }
}
