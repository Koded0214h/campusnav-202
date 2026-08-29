package com.campusnav.route;

import com.campusnav.location.BuildingRepository;
import com.campusnav.location.PoiRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RouteServiceTest {

    private final RouteService service = new RouteService(
            mock(BuildingRepository.class),
            mock(PoiRepository.class),
            new RoutingProperties(""),
            RestClient.builder());

    @Test
    void calculatesFallbackRouteFromCoordinates() {
        RouteDtos.Response route = service.route(6.5178, 3.3958, null,
                6.5175, 3.3976, false);

        assertThat(route.distanceMeters()).isPositive();
        assertThat(route.durationSeconds()).isPositive();
        assertThat(route.path().type()).isEqualTo("LineString");
        assertThat(route.path().coordinates()).hasSize(2);
    }

    @Test
    void accessibleFallbackAllowsExtraDistance() {
        RouteDtos.Response normal = service.route(6.5178, 3.3958, null,
                6.5175, 3.3976, false);
        RouteDtos.Response accessible = service.route(6.5178, 3.3958, null,
                6.5175, 3.3976, true);

        assertThat(accessible.accessible()).isTrue();
        assertThat(accessible.distanceMeters()).isGreaterThan(normal.distanceMeters());
    }
}
