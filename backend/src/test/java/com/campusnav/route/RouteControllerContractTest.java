package com.campusnav.route;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RouteControllerContractTest {

    private RouteService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(RouteService.class);
        mvc = MockMvcBuilders.standaloneSetup(new RouteController(service)).build();
    }

    @Test
    void matchesPrdRouteContract() throws Exception {
        RouteDtos.Response response = new RouteDtos.Response(340, 260, true,
                new RouteDtos.Path("LineString", List.of(
                        List.of(3.397, 6.517),
                        List.of(3.398, 6.518))));
        when(service.route(6.516, 3.396, 12L, null, null, true)).thenReturn(response);

        mvc.perform(get("/api/route")
                        .param("fromLat", "6.516")
                        .param("fromLng", "3.396")
                        .param("toId", "12")
                        .param("accessible", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.*", hasSize(4)))
                .andExpect(jsonPath("$.distanceMeters").value(340))
                .andExpect(jsonPath("$.durationSeconds").value(260))
                .andExpect(jsonPath("$.accessible").value(true))
                .andExpect(jsonPath("$.path.*", hasSize(2)))
                .andExpect(jsonPath("$.path.type").value("LineString"))
                .andExpect(jsonPath("$.path.coordinates[0][0]").value(3.397))
                .andExpect(jsonPath("$.path.coordinates[0][1]").value(6.517));

        verify(service).route(6.516, 3.396, 12L, null, null, true);
    }
}
