package com.templedrop.config;

import com.templedrop.security.AdminAuthFilter;
import com.templedrop.security.CsrfFilter;
import com.templedrop.security.RateLimitFilter;
import com.templedrop.security.SessionAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final SessionAuthFilter sessionAuthFilter;
    private final AdminAuthFilter adminAuthFilter;
    private final CsrfFilter csrfFilter;
    private final RateLimitFilter rateLimitFilter;
    private final AppProperties appProperties;

    public SecurityConfig(
        SessionAuthFilter sessionAuthFilter,
        AdminAuthFilter adminAuthFilter,
        CsrfFilter csrfFilter,
        RateLimitFilter rateLimitFilter,
        AppProperties appProperties
    ) {
        this.sessionAuthFilter = sessionAuthFilter;
        this.adminAuthFilter = adminAuthFilter;
        this.csrfFilter = csrfFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.appProperties = appProperties;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh.authenticationEntryPoint((req, res, ex) -> {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                res.getWriter().write("{\"error\":\"Authentication required\"}");
            }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/health",
                    "/api/csrf-token",
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/guest",
                    "/api/auth/logout",
                    "/api/game/config",
                    "/api/game/provider-config",
                    "/api/admin/login",
                    "/api/admin/logout"
                ).permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(sessionAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(adminAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(csrfFilter, SessionAuthFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            appProperties.getCorsOrigin(),
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
