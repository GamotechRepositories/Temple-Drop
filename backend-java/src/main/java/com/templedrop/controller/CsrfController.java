package com.templedrop.controller;

import com.templedrop.config.AppProperties;
import com.templedrop.security.CsrfService;
import com.templedrop.security.SessionAuthFilter;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/csrf-token")
public class CsrfController {
    private final CsrfService csrfService;
    private final AppProperties appProperties;

    public CsrfController(CsrfService csrfService, AppProperties appProperties) {
        this.csrfService = csrfService;
        this.appProperties = appProperties;
    }

    @GetMapping
    public Map<String, String> getCsrfToken(HttpServletRequest request, HttpServletResponse response) {
        String sessionToken = SessionAuthFilter.extractSessionToken(request);
        String effectiveSession = (sessionToken != null && !sessionToken.isBlank()) ? sessionToken : "anonymous";
        String csrfToken = csrfService.generateToken(effectiveSession);

        Cookie cookie = new Cookie(CsrfService.CSRF_COOKIE_NAME, csrfToken);
        cookie.setHttpOnly(false);
        cookie.setSecure(appProperties.isCookieSecure());
        cookie.setPath("/");
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);

        return Map.of("csrfToken", csrfToken);
    }
}
