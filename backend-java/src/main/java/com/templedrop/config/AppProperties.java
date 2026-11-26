package com.templedrop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String env = "development";
    private String corsOrigin = "http://localhost:5173";
    private boolean cookieSecure = false;
    private String csrfSecret = "temple-drop-csrf-fallback-secret-2026";
    private String sessionSecret = "temple_drop_jwt_and_session_secret_32_characters_min!";
    private boolean serveStatic = true;

    public String getEnv() { return env; }
    public void setEnv(String env) { this.env = env; }

    public String getCorsOrigin() { return corsOrigin; }
    public void setCorsOrigin(String corsOrigin) { this.corsOrigin = corsOrigin; }

    public boolean isCookieSecure() { return cookieSecure; }
    public void setCookieSecure(boolean cookieSecure) { this.cookieSecure = cookieSecure; }

    public String getCsrfSecret() { return csrfSecret; }
    public void setCsrfSecret(String csrfSecret) { this.csrfSecret = csrfSecret; }

    public String getSessionSecret() { return sessionSecret; }
    public void setSessionSecret(String sessionSecret) { this.sessionSecret = sessionSecret; }

    public boolean isServeStatic() { return serveStatic; }
    public void setServeStatic(boolean serveStatic) { this.serveStatic = serveStatic; }

    public boolean isProduction() {
        return "production".equalsIgnoreCase(env);
    }
}
