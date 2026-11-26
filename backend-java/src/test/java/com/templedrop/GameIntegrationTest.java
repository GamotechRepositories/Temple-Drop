package com.templedrop;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templedrop.security.CsrfService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GameIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void fullGuestDropIdempotencyAndHistoryFlow() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("healthy"));

        MvcResult guestRes = mockMvc.perform(post("/api/auth/guest"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.user.isGuest").value(true))
            .andExpect(jsonPath("$.wallet.balanceCents").value(1000000))
            .andReturn();

        Cookie sessionCookie = guestRes.getResponse().getCookie(CsrfService.SESSION_COOKIE_NAME);
        assertNotNull(sessionCookie);

        MvcResult csrfRes = mockMvc.perform(get("/api/csrf-token").cookie(sessionCookie))
            .andExpect(status().isOk())
            .andReturn();
        String csrfToken = objectMapper.readTree(csrfRes.getResponse().getContentAsString()).get("csrfToken").asText();

        // Invalid bet returns 400
        mockMvc.perform(post("/api/game/drop")
                .cookie(sessionCookie)
                .header(CsrfService.CSRF_HEADER_NAME, csrfToken)
                .header("x-idempotency-key", "invalid_1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"betPerBallCents\":123,\"ballCount\":10}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());

        // Valid drop with idempotency key
        MvcResult drop1 = mockMvc.perform(post("/api/game/drop")
                .cookie(sessionCookie)
                .header(CsrfService.CSRF_HEADER_NAME, csrfToken)
                .header("x-idempotency-key", "drop_key_1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"betPerBallCents\":50,\"ballCount\":10}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.balls.length()").value(10))
            .andReturn();

        // Same key + same payload returns cached response
        MvcResult drop2 = mockMvc.perform(post("/api/game/drop")
                .cookie(sessionCookie)
                .header(CsrfService.CSRF_HEADER_NAME, csrfToken)
                .header("x-idempotency-key", "drop_key_1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"betPerBallCents\":50,\"ballCount\":10}"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Cache-Lookup", "HIT"))
            .andReturn();

        JsonNode n1 = objectMapper.readTree(drop1.getResponse().getContentAsString());
        JsonNode n2 = objectMapper.readTree(drop2.getResponse().getContentAsString());
        assertEquals(n1.get("roundId").asText(), n2.get("roundId").asText());

        // Same key + different payload returns 422
        mockMvc.perform(post("/api/game/drop")
                .cookie(sessionCookie)
                .header(CsrfService.CSRF_HEADER_NAME, csrfToken)
                .header("x-idempotency-key", "drop_key_1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"betPerBallCents\":100,\"ballCount\":10}"))
            .andExpect(status().isUnprocessableEntity());

        // History reflects the round
        mockMvc.perform(get("/api/game/history").cookie(sessionCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRounds").value(1));
    }
}
