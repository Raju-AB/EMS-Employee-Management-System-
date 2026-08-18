package com.tcs.ems.controller;

import com.tcs.ems.dto.RegisterRequest;
import com.tcs.ems.dto.VerifyOtpRequest;
import com.tcs.ems.service.OtpService;
import com.tcs.ems.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@Tag(name = "User Registration & OTP Portal", description = "Public endpoints for registering new accounts and verifying/resending OTPs")
public class UserController {

    private final UserService userService;
    private final OtpService otpService;

    public UserController(UserService userService, OtpService otpService) {
        this.userService = userService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register New User", description = "Registers a new user account and triggers an email containing a 6-digit OTP code.")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        String message = userService.register(registerRequest);
        return new ResponseEntity<>(Map.of("message", message, "status", "success"), HttpStatus.CREATED);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP Code", description = "Verifies the 6-digit OTP sent to the user's email to activate the account.")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyOtpRequest) {
        String message = otpService.verifyOtp(verifyOtpRequest);
        return ResponseEntity.ok(Map.of("message", message, "status", "success"));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP Code", description = "Dispatches a new 6-digit OTP code if the cooldown period (60s) has passed.")
    public ResponseEntity<Map<String, String>> resendOtp(@RequestParam String email) {
        String message = otpService.resendOtp(email);
        return ResponseEntity.ok(Map.of("message", message, "status", "success"));
    }
}
