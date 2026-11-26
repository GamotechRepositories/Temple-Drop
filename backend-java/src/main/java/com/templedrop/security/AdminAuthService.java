package com.templedrop.security;

import com.templedrop.config.AppProperties;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class AdminAuthService {
    public static final String ADMIN_COOKIE_NAME = "td_admin_session";
    private static final long TOKEN_TTL_MS = 1000L * 60 * 60 * 24; // 24 hours

    private final byte[] secretBytes;
    private final AppProperties appProperties;

    public AdminAuthService(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.secretBytes = ("admin:" + appProperties.getSessionSecret()).getBytes(StandardCharsets.UTF_8);
    }

    public boolean verifyCredentials(String username, String password) {
        if (username == null || password == null) return false;
        return constantTimeEquals(appProperties.getAdminUsername(), username)
            && constantTimeEquals(appProperties.getAdminPassword(), password);
    }

    public String issueToken(String username) {
        long expiresAt = System.currentTimeMillis() + TOKEN_TTL_MS;
        String payload = username + "." + expiresAt;
        String sig = hmacSha256Hex(payload);
        return payload + "." + sig;
    }

    public String verifyAndExtractUsername(String token) {
        if (token == null || token.isBlank()) return null;
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) return null;

        String username = parts[0];
        long expiresAt;
        try {
            expiresAt = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            return null;
        }
        if (System.currentTimeMillis() > expiresAt) {
            return null;
        }

        String expectedSig = hmacSha256Hex(username + "." + parts[1]);
        if (!constantTimeEquals(expectedSig, parts[2])) {
            return null;
        }
        return username;
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] ab = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        return ab.length == bb.length && MessageDigest.isEqual(ab, bb);
    }

    private String hmacSha256Hex(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign admin token", e);
        }
    }
}
