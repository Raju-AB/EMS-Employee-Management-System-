package com.tcs.ems.exception;

public class MaxOtpAttemptsExceededException extends RuntimeException {
    public MaxOtpAttemptsExceededException(String message) {
        super(message);
    }
}
