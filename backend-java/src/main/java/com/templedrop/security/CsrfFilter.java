package com.templedrop.security;

import com.templedrop.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class CsrfFilter extends OncePerRequestFilter {
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private static final Set<String> EXEMPT_PATHS = Set.of(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/guest"
    );

    private final CsrfService csrfService;
    private final AppProperties appProperties;

    public CsrfFilter(CsrfService csrfService, AppProperties appProperties) {
        this.csrfService = csrfService;
        this.appProperties = appProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String sessionToken = SessionAuthFilter.extractSessionToken(request);
        String effectiveSession = (sessionToken != null && !sessionToken.isBlank()) ? sessionToken : "anonymous";

        String existingCsrf = extractCookie(request, CsrfService.CSRF_COOKIE_NAME);
        if (existingCsrf == null || !csrfService.verifyToken(existingCsrf, effectiveSession)) {
            String newToken = csrfService.generateToken(effectiveSession);
            Cookie cookie = new Cookie(CsrfService.CSRF_COOKIE_NAME, newToken);
            cookie.setHttpOnly(false);
            cookie.setSecure(appProperties.isCookieSecure());
            cookie.setPath("/");
            cookie.setAttribute("SameSite", "Lax");
            response.addCookie(cookie);
        }

        String path = request.getRequestURI();
        if (path.startsWith("/api/")
            && !SAFE_METHODS.contains(request.getMethod())
            && !EXEMPT_PATHS.contains(path)
            && path.startsWith("/api/game") && !"/api/game/history".equals(path)) {

            String headerToken = request.getHeader(CsrfService.CSRF_HEADER_NAME);
            if (!csrfService.verifyToken(headerToken, effectiveSession)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"Invalid or missing CSRF token\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
