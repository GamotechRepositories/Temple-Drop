package com.templedrop.controller;

import com.templedrop.config.AppProperties;
import com.templedrop.dto.AdminDtos;
import com.templedrop.exception.ApiException;
import com.templedrop.model.GameConfigVersionDocument;
import com.templedrop.security.AdminAuthService;
import com.templedrop.service.AdminAuditService;
import com.templedrop.service.AdminService;
import com.templedrop.service.GameConfigService;
import com.templedrop.service.PayoutAnalysisService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminAuthService adminAuthService;
    private final AdminService adminService;
    private final AppProperties appProperties;
    private final GameConfigService gameConfigService;
    private final PayoutAnalysisService payoutAnalysisService;
    private final AdminAuditService auditService;

    public AdminController(
        AdminAuthService adminAuthService,
        AdminService adminService,
        AppProperties appProperties,
        GameConfigService gameConfigService,
        PayoutAnalysisService payoutAnalysisService,
        AdminAuditService auditService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminService = adminService;
        this.appProperties = appProperties;
        this.gameConfigService = gameConfigService;
        this.payoutAnalysisService = payoutAnalysisService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public AdminDtos.AdminSessionResponse login(
        @Valid @RequestBody AdminDtos.LoginRequest req,
        HttpServletResponse response
    ) {
        if (!adminAuthService.verifyCredentials(req.username(), req.password())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials");
        }
        String token = adminAuthService.issueToken(req.username());
        setAdminCookie(response, token, 60 * 60 * 24);
        return new AdminDtos.AdminSessionResponse(true, req.username(), token);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletResponse response) {
        setAdminCookie(response, "", 0);
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public AdminDtos.AdminSessionResponse me(Authentication authentication) {
        String username = authentication != null ? String.valueOf(authentication.getPrincipal()) : "admin";
        return new AdminDtos.AdminSessionResponse(true, username, null);
    }

    @GetMapping("/stats")
    public AdminDtos.AdminStatsResponse stats() {
        return adminService.getStats();
    }

    @GetMapping("/providers")
    public Map<String, List<AdminDtos.ProviderConfigResponse>> listProviders() {
        return Map.of("providers", adminService.listProviders());
    }

    @PostMapping("/providers")
    public Map<String, AdminDtos.ProviderConfigResponse> createProvider(
        @Valid @RequestBody AdminDtos.ProviderConfigRequest req
    ) {
        return Map.of("provider", adminService.createProvider(req));
    }

    @PatchMapping("/providers/{id}")
    public Map<String, AdminDtos.ProviderConfigResponse> updateProvider(
        @PathVariable String id,
        @Valid @RequestBody AdminDtos.ProviderConfigRequest req
    ) {
        return Map.of("provider", adminService.updateProvider(id, req));
    }

    @DeleteMapping("/providers/{id}")
    public Map<String, Object> deleteProvider(@PathVariable String id) {
        adminService.deleteProvider(id);
        return Map.of("deleted", true);
    }

    @GetMapping("/rounds")
    public Map<String, List<AdminDtos.AdminRoundSummary>> listRounds(
        @RequestParam(defaultValue = "25") int limit
    ) {
        return Map.of("rounds", adminService.listRecentRounds(limit));
    }

    @GetMapping("/players")
    public Map<String, List<AdminDtos.AdminPlayerSummary>> listPlayers(
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(required = false) String q
    ) {
        return Map.of("players", adminService.listPlayers(limit, q));
    }

    @GetMapping("/players/{id}/details")
    public Map<String, Object> getPlayerDetails(@PathVariable String id) {
        return adminService.getPlayerDetails(id);
    }

    @PostMapping("/players")
    public Map<String, AdminDtos.AdminPlayerSummary> createPlayer(
        @Valid @RequestBody AdminDtos.CreatePlayerRequest req
    ) {
        return Map.of("player", adminService.createPlayer(req));
    }

    @PostMapping("/players/{id}/wallet")
    public Map<String, AdminDtos.AdminPlayerSummary> adjustPlayerWallet(
        @PathVariable String id,
        @Valid @RequestBody AdminDtos.AdminWalletAdjustRequest req,
        Authentication authentication
    ) {
        String adminUser = authentication != null ? String.valueOf(authentication.getPrincipal()) : "admin";
        return Map.of("player", adminService.adjustPlayerWallet(id, req, adminUser));
    }

    @PostMapping("/players/{id}/password")
    public Map<String, Object> resetPlayerPassword(
        @PathVariable String id,
        @Valid @RequestBody AdminDtos.ResetPlayerPasswordRequest req,
        Authentication authentication
    ) {
        String adminUser = authentication != null ? String.valueOf(authentication.getPrincipal()) : "admin";
        adminService.resetPlayerPassword(id, req.password(), adminUser);
        return Map.of("updated", true);
    }

    @GetMapping("/config")
    public Map<String, Object> getConfigState() {
        GameConfigVersionDocument published = gameConfigService.getPublishedConfig();
        GameConfigVersionDocument current = gameConfigService.getActiveDraftOrPublished();
        PayoutAnalysisService.PayoutEstimate estimate = payoutAnalysisService.analyze(
            current,
            current.getDefaultBetPerBallCents(),
            current.getDefaultBallsPerDrop(),
            current.getTargetRtpPct()
        );
        return Map.of(
            "published", published,
            "current", current,
            "hasDraft", "DRAFT".equals(current.getStatus()),
            "estimate", estimate
        );
    }

    @PostMapping("/config/draft")
    public Map<String, Object> saveDraft(
        @RequestBody GameConfigVersionDocument draftPayload,
        Authentication authentication
    ) {
        String adminUser = authentication != null ? String.valueOf(authentication.getPrincipal()) : "admin";
        GameConfigVersionDocument saved = gameConfigService.saveDraft(draftPayload, adminUser);
        return Map.of("draft", saved);
    }

    @PostMapping("/config/preview")
    public Map<String, Object> validateAndPreview(
        @RequestBody GameConfigVersionDocument candidate,
        @RequestParam(required = false) Long betPerBallCents,
        @RequestParam(required = false) Integer ballCount
    ) {
        return gameConfigService.validateAndPreview(candidate, betPerBallCents, ballCount);
    }

    public record PublishConfigRequest(
        int baseVersion,
        String publishReason,
        GameConfigVersionDocument config
    ) {}

    @PostMapping("/config/publish")
    public Map<String, Object> publishConfig(
        @RequestBody PublishConfigRequest req,
        Authentication authentication
    ) {
        String adminUser = authentication != null ? String.valueOf(authentication.getPrincipal()) : "admin";
        GameConfigVersionDocument published = gameConfigService.publishDraft(
            req.baseVersion(),
            req.publishReason(),
            req.config(),
            adminUser
        );
        return Map.of("published", published);
    }

    @GetMapping("/config/history")
    public Map<String, Object> getConfigHistory() {
        return Map.of("versions", gameConfigService.listConfigHistory());
    }

    @GetMapping("/config/compare")
    public Map<String, Object> compareConfigs(
        @RequestParam int v1,
        @RequestParam int v2
    ) {
        return gameConfigService.compareVersions(v1, v2);
    }

    @GetMapping("/payout-report")
    public Map<String, Object> getPayoutReport() {
        return adminService.getHistoricalPayoutReport();
    }

    @GetMapping("/audit")
    public Map<String, Object> getAuditLogs(@RequestParam(defaultValue = "100") int limit) {
        return Map.of("logs", auditService.listRecent(limit));
    }

    private void setAdminCookie(HttpServletResponse response, String value, int maxAgeSeconds) {
        Cookie cookie = new Cookie(AdminAuthService.ADMIN_COOKIE_NAME, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(appProperties.isCookieSecure());
        cookie.setPath("/");
        cookie.setMaxAge(maxAgeSeconds);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }
}
