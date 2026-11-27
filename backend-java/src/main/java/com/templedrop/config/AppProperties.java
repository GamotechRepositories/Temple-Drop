package com.templedrop.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String env = "development";
    private String corsOrigin = "http://localhost:5173";
    private boolean cookieSecure = false;
    private String csrfSecret = "";
    private String sessionSecret = "";
    private boolean serveStatic = true;
    private String adminUsername = "";
    private String adminPassword = "";
    private String operationsApiUrl = "";
    private String internalServiceKey = "";

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

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }

    public String getAdminPassword() { return adminPassword; }
    public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }

    public String getOperationsApiUrl() { return operationsApiUrl; }
    public void setOperationsApiUrl(String operationsApiUrl) { this.operationsApiUrl = operationsApiUrl; }

    public String getInternalServiceKey() { return internalServiceKey; }
    public void setInternalServiceKey(String internalServiceKey) { this.internalServiceKey = internalServiceKey; }

    public boolean isProduction() {
        return "production".equalsIgnoreCase(env);
    }
}
