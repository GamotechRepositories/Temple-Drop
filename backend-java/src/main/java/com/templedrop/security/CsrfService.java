package com.templedrop.security;

import com.templedrop.config.AppProperties;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class CsrfService {
    public static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    public static final String CSRF_HEADER_NAME = "x-csrf-token";
    public static final String SESSION_COOKIE_NAME = "td_session";

    private final byte[] secretBytes;

    public CsrfService(AppProperties appProperties) {
        this.secretBytes = appProperties.getCsrfSecret().getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(String sessionId) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String sig = hmacSha256Hex(sessionId + ":" + timestamp);
        return timestamp + "." + sig;
    }

    public boolean verifyToken(String token, String sessionId) {
        if (token == null || token.isBlank()) return false;
        String[] parts = token.split("\\.", -1);
        if (parts.length != 2) return false;
        String expected = hmacSha256Hex(sessionId + ":" + parts[0]);
        byte[] actualBytes = parts[1].getBytes(StandardCharsets.UTF_8);
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        return actualBytes.length == expectedBytes.length && MessageDigest.isEqual(actualBytes, expectedBytes);
    }

    private String hmacSha256Hex(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute HMAC-SHA256", e);
        }
    }
}
