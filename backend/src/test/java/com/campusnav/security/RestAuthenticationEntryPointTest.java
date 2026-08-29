package com.campusnav.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class RestAuthenticationEntryPointTest {

    @Test
    void writesJsonMessageForUnauthorizedRequests() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/pins");
        MockHttpServletResponse response = new MockHttpServletResponse();
        RestAuthenticationEntryPoint entryPoint =
                new RestAuthenticationEntryPoint(new ObjectMapper().findAndRegisterModules());

        entryPoint.commence(request, response, new BadCredentialsException("rejected"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json");
        assertThat(response.getContentAsString())
                .contains("Authentication is required")
                .doesNotContain("rejected");
    }
}
