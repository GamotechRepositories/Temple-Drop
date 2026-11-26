package com.templedrop.security;

import com.templedrop.model.SessionDocument;
import com.templedrop.model.UserDocument;
import com.templedrop.repository.SessionRepository;
import com.templedrop.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class SessionAuthFilter extends OncePerRequestFilter {
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public SessionAuthFilter(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String token = extractSessionToken(request);
        if (token != null && !token.isBlank()) {
            Optional<SessionDocument> sessionOpt = sessionRepository.findByTokenAndExpiresAtAfter(token, Instant.now());
            if (sessionOpt.isPresent()) {
                SessionDocument session = sessionOpt.get();
                Optional<UserDocument> userOpt = userRepository.findById(session.getUserId().toHexString());
                if (userOpt.isPresent()) {
                    AuthenticatedUser principal = new AuthenticatedUser(userOpt.get(), session.getUserId());
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    public static String extractSessionToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (CsrfService.SESSION_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
