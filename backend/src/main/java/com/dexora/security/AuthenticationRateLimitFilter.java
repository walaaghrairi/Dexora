package com.dexora.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class AuthenticationRateLimitFilter extends OncePerRequestFilter {
    private static final Set<String> PROTECTED_PATHS = Set.of(
            "/auth/login", "/auth/register", "/auth/google", "/auth/2fa/verify", "/auth/email/resend"
    );

    private final ConcurrentHashMap<String, RequestWindow> windows = new ConcurrentHashMap<>();
    private final int requestLimit;
    private final long windowMillis;
    private final Clock clock;
    private final AtomicLong requestCounter = new AtomicLong();

    @Autowired
    public AuthenticationRateLimitFilter(
            @Value("${application.security.rate-limit.requests:10}") int requestLimit,
            @Value("${application.security.rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this(requestLimit, windowSeconds, Clock.systemUTC());
    }

    AuthenticationRateLimitFilter(int requestLimit, long windowSeconds, Clock clock) {
        this.requestLimit = Math.max(1, requestLimit);
        this.windowMillis = Math.max(1, windowSeconds) * 1000;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod()) || !PROTECTED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        long now = clock.millis();
        String key = request.getRemoteAddr() + ':' + request.getRequestURI();
        RequestWindow window = windows.compute(key, (ignored, current) ->
                current == null || now >= current.expiresAt
                        ? new RequestWindow(now + windowMillis)
                        : current
        );

        int count = window.increment();
        if (requestCounter.incrementAndGet() % 500 == 0) {
            windows.entrySet().removeIf(entry -> now >= entry.getValue().expiresAt);
        }

        if (count > requestLimit) {
            long retryAfterSeconds = Math.max(1, (window.expiresAt - now + 999) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"code\":\"RATE_LIMITED\",\"message\":\"Trop de tentatives. Réessayez plus tard.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static final class RequestWindow {
        private final long expiresAt;
        private int requests;

        private RequestWindow(long expiresAt) {
            this.expiresAt = expiresAt;
        }

        private synchronized int increment() {
            return ++requests;
        }
    }
}
