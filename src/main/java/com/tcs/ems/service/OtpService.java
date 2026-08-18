package com.tcs.ems.service;

import com.tcs.ems.dto.VerifyOtpRequest;
import com.tcs.ems.entity.User;
import com.tcs.ems.exception.*;
import com.tcs.ems.repository.UserRepository;
import com.tcs.ems.util.OtpGenarator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_OTP_ATTEMPTS = 3;
    private static final long COOLDOWN_SECONDS = 60;

    public OtpService(UserRepository userRepository, EmailService emailService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String verifyOtp(VerifyOtpRequest verifyOtpRequest) {
        User user = userRepository.findByEmail(verifyOtpRequest.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + verifyOtpRequest.getEmail()));

        if (user.isVerified()) {
            return "User account is already verified.";
        }

        if (user.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            throw new MaxOtpAttemptsExceededException("Maximum OTP verification attempts (" + MAX_OTP_ATTEMPTS + ") exceeded. Please request a new OTP.");
        }

        if (user.getOtpExpiryTime() == null || LocalDateTime.now().isAfter(user.getOtpExpiryTime())) {
            throw new OtpExpiredException("OTP has expired. Please request a new OTP.");
        }

        boolean matches = user.getOtpHash() != null && passwordEncoder.matches(verifyOtpRequest.getOtp(), user.getOtpHash());

        if (!matches) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            int remaining = MAX_OTP_ATTEMPTS - user.getOtpAttempts();
            if (remaining > 0) {
                throw new InvalidOtpException("Invalid OTP code. " + remaining + " attempt(s) remaining.");
            } else {
                throw new MaxOtpAttemptsExceededException("Maximum OTP verification attempts exceeded. Please request a new OTP.");
            }
        }

        // Successfully verified
        user.setVerified(true);
        user.setOtpHash(null);
        user.setOtpExpiryTime(null);
        user.setOtpAttempts(0);
        userRepository.save(user);

        return "OTP verified successfully. Your account is now active.";
    }

    @Transactional
    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if (user.getLastOtpRequestTime() != null) {
            long secondsElapsed = Duration.between(user.getLastOtpRequestTime(), LocalDateTime.now()).getSeconds();
            if (secondsElapsed < COOLDOWN_SECONDS) {
                long waitTime = COOLDOWN_SECONDS - secondsElapsed;
                throw new OtpCooldownException("Please wait " + waitTime + " second(s) before requesting a new OTP.");
            }
        }

        String newRawOtp = OtpGenarator.generateOtp();
        user.setOtpHash(passwordEncoder.encode(newRawOtp));
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        user.setOtpAttempts(0);
        user.setLastOtpRequestTime(LocalDateTime.now());
        userRepository.save(user);

        emailService.sendOtp(email, newRawOtp);

        return "New 6-digit OTP code sent successfully to " + email;
    }
}