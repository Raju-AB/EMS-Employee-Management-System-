package com.tcs.ems.util;

import java.security.SecureRandom;

public class OtpGenarator {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static String generateOtp() {
        int otp = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }
}
