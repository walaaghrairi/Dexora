package com.dexora.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthenticationRateLimitFilterTest {

    @Test
    void blocksAuthenticationRequestsAfterTheConfiguredLimit() throws Exception {
        AuthenticationRateLimitFilter filter = new AuthenticationRateLimitFilter(2, 60, Clock.systemUTC());

        assertEquals(200, execute(filter, "/auth/login").getStatus());
        assertEquals(200, execute(filter, "/auth/login").getStatus());

        MockHttpServletResponse blocked = execute(filter, "/auth/login");
        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
        assertEquals(true, blocked.getContentAsString().contains("RATE_LIMITED"));
    }

    @Test
    void doesNotRateLimitOrdinaryApiRequests() throws Exception {
        AuthenticationRateLimitFilter filter = new AuthenticationRateLimitFilter(1, 60, Clock.systemUTC());

        assertEquals(200, execute(filter, "/account").getStatus());
        assertEquals(200, execute(filter, "/account").getStatus());
    }

    private MockHttpServletResponse execute(AuthenticationRateLimitFilter filter, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
