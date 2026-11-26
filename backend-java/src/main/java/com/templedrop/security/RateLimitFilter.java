package com.templedrop.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final Map<String, Deque<Long>> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Deque<Long>> gameplayBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = request.getRemoteAddr();

        if (path.startsWith("/api/auth/")) {
            if (!allow(authBuckets, clientIp, 30, 60_000L)) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"Too many authentication attempts, please try again in a minute.\"}");
                return;
            }
        } else if ("/api/game/drop".equals(path) || "/api/game/spin".equals(path) || "/api/game/bonus/drop".equals(path)) {
            if (!allow(gameplayBuckets, clientIp, 40, 10_000L)) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"Too many gameplay actions, please slow down.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean allow(Map<String, Deque<Long>> buckets, String key, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();
        Deque<Long> deque = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && now - deque.peekFirst() > windowMs) {
                deque.pollFirst();
            }
            if (deque.size() >= maxRequests) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }
}
