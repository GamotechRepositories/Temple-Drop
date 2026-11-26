package com.templedrop.service;

import com.templedrop.config.AppProperties;
import com.templedrop.config.GameConfig;
import com.templedrop.dto.AuthDtos;
import com.templedrop.exception.ApiException;
import com.templedrop.model.GameStateDocument;
import com.templedrop.model.SessionDocument;
import com.templedrop.model.UserDocument;
import com.templedrop.model.WalletDocument;
import com.templedrop.model.WalletLedgerDocument;
import com.templedrop.repository.GameStateRepository;
import com.templedrop.repository.SessionRepository;
import com.templedrop.repository.UserRepository;
import com.templedrop.repository.WalletLedgerRepository;
import com.templedrop.repository.WalletRepository;
import com.templedrop.security.CsrfService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class AuthService {
    private static final long SESSION_DURATION_MS = 30L * 24 * 60 * 60 * 1000;
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final GameStateRepository gameStateRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    public AuthService(
        UserRepository userRepository,
        WalletRepository walletRepository,
        WalletLedgerRepository walletLedgerRepository,
        GameStateRepository gameStateRepository,
        SessionRepository sessionRepository,
        PasswordEncoder passwordEncoder,
        AppProperties appProperties
    ) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.gameStateRepository = gameStateRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req, HttpServletResponse response) {
        String normalizedEmail = req.email().toLowerCase().trim();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        UserDocument user = new UserDocument();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setGuest(false);
        user = userRepository.save(user);

        ObjectId userId = new ObjectId(user.getId());

        WalletDocument wallet = new WalletDocument();
        wallet.setUserId(userId);
        wallet.setBalanceCents(GameConfig.INITIAL_BALANCE_CENTS);
        wallet.setInitialCents(GameConfig.INITIAL_BALANCE_CENTS);
        wallet.setVersion(0L);
        wallet = walletRepository.save(wallet);

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setType("INITIAL");
        ledger.setAmountCents(GameConfig.INITIAL_BALANCE_CENTS);
        ledger.setBalanceAfterCents(GameConfig.INITIAL_BALANCE_CENTS);
        ledger.setDescription("Initial welcome demo credits");
        walletLedgerRepository.save(ledger);

        GameStateDocument gameState = new GameStateDocument();
        gameState.setUserId(userId);
        gameState.setSpinPoints(0);
        gameState.setEnergyPoints(0);
        gameStateRepository.save(gameState);

        issueSessionCookie(userId, response);

        return new AuthDtos.AuthResponse(
            AuthDtos.UserDto.from(user),
            AuthDtos.WalletDto.from(wallet)
        );
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req, HttpServletResponse response) {
        String normalizedEmail = req.email().toLowerCase().trim();
        UserDocument user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        ObjectId userId = new ObjectId(user.getId());
        WalletDocument wallet = walletRepository.findByUserId(userId).orElseGet(() -> {
            WalletDocument w = new WalletDocument();
            w.setUserId(userId);
            w.setBalanceCents(GameConfig.INITIAL_BALANCE_CENTS);
            w.setInitialCents(GameConfig.INITIAL_BALANCE_CENTS);
            return walletRepository.save(w);
        });

        issueSessionCookie(userId, response);

        return new AuthDtos.AuthResponse(
            AuthDtos.UserDto.from(user),
            AuthDtos.WalletDto.from(wallet)
        );
    }

    public AuthDtos.AuthResponse guestLogin(HttpServletResponse response) {
        byte[] bytes = new byte[4];
        secureRandom.nextBytes(bytes);
        String guestEmail = "explorer_" + HexFormat.of().formatHex(bytes) + "@templedrop.local";

        UserDocument user = new UserDocument();
        user.setEmail(guestEmail);
        user.setGuest(true);
        user.setAvatarId("explorer");
        user = userRepository.save(user);

        ObjectId userId = new ObjectId(user.getId());

        WalletDocument wallet = new WalletDocument();
        wallet.setUserId(userId);
        wallet.setBalanceCents(GameConfig.INITIAL_BALANCE_CENTS);
        wallet.setInitialCents(GameConfig.INITIAL_BALANCE_CENTS);
        wallet = walletRepository.save(wallet);

        WalletLedgerDocument ledger = new WalletLedgerDocument();
        ledger.setUserId(userId);
        ledger.setType("INITIAL");
        ledger.setAmountCents(GameConfig.INITIAL_BALANCE_CENTS);
        ledger.setBalanceAfterCents(GameConfig.INITIAL_BALANCE_CENTS);
        ledger.setDescription("Demo explorer initial credits");
        walletLedgerRepository.save(ledger);

        GameStateDocument gameState = new GameStateDocument();
        gameState.setUserId(userId);
        gameState.setSpinPoints(0);
        gameState.setEnergyPoints(0);
        gameStateRepository.save(gameState);

        issueSessionCookie(userId, response);

        return new AuthDtos.AuthResponse(
            AuthDtos.UserDto.from(user),
            AuthDtos.WalletDto.from(wallet)
        );
    }

    public void logout(String sessionToken, HttpServletResponse response) {
        if (sessionToken != null && !sessionToken.isBlank()) {
            sessionRepository.deleteByToken(sessionToken);
        }
        Cookie clearCookie = new Cookie(CsrfService.SESSION_COOKIE_NAME, "");
        clearCookie.setPath("/");
        clearCookie.setMaxAge(0);
        response.addCookie(clearCookie);
    }

    public AuthDtos.AuthResponse me(UserDocument user, ObjectId userId) {
        WalletDocument wallet = walletRepository.findByUserId(userId).orElseGet(() -> {
            WalletDocument w = new WalletDocument();
            w.setUserId(userId);
            w.setBalanceCents(GameConfig.INITIAL_BALANCE_CENTS);
            w.setInitialCents(GameConfig.INITIAL_BALANCE_CENTS);
            return walletRepository.save(w);
        });
        return new AuthDtos.AuthResponse(
            AuthDtos.UserDto.from(user),
            AuthDtos.WalletDto.from(wallet)
        );
    }

    private void issueSessionCookie(ObjectId userId, HttpServletResponse response) {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = HexFormat.of().formatHex(tokenBytes);

        SessionDocument session = new SessionDocument();
        session.setToken(token);
        session.setUserId(userId);
        session.setExpiresAt(Instant.now().plusMillis(SESSION_DURATION_MS));
        sessionRepository.save(session);

        Cookie cookie = new Cookie(CsrfService.SESSION_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(appProperties.isCookieSecure());
        cookie.setPath("/");
        cookie.setMaxAge((int) (SESSION_DURATION_MS / 1000L));
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }
}
