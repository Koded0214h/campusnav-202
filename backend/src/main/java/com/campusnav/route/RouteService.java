package com.campusnav.route;

import com.campusnav.common.NotFoundException;
import com.campusnav.location.BuildingRepository;
import com.campusnav.location.PoiRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.campusnav.route.RouteDtos.Path;
import static com.campusnav.route.RouteDtos.Response;

@Service
public class RouteService {
    private static final double WALKING_METERS_PER_SECOND = 1.3;
    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private final BuildingRepository buildings;
    private final PoiRepository pois;
    private final RoutingProperties properties;
    private final RestClient http;

    public RouteService(BuildingRepository buildings, PoiRepository pois,
                        RoutingProperties properties, RestClient.Builder builder) {
        this.buildings = buildings;
        this.pois = pois;
        this.properties = properties;
        this.http = builder.baseUrl("https://api.mapbox.com").build();
    }

    public Response route(double fromLat, double fromLng, Long toId,
                          Double toLat, Double toLng, boolean accessible) {
        Coordinate destination = destination(toId, toLat, toLng);
        Coordinate start = new Coordinate(fromLat, fromLng);
        return mapboxRoute(start, destination, accessible)
                .orElseGet(() -> directRoute(start, destination, accessible));
    }

    private Optional<Response> mapboxRoute(Coordinate from, Coordinate to, boolean accessible) {
        if (properties.mapboxToken() == null || properties.mapboxToken().isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode body = requestMapbox(from, to, accessible);
            return parseMapbox(body, accessible);
        } catch (RestClientException exception) {
            return Optional.empty();
        }
    }

    private JsonNode requestMapbox(Coordinate from, Coordinate to, boolean accessible) {
        String coordinates = from.lng() + "," + from.lat() + ";" + to.lng() + "," + to.lat();
        return http.get().uri(builder -> builder
                        .path("/directions/v5/mapbox/walking/{coordinates}")
                        .queryParam("geometries", "geojson")
                        .queryParam("overview", "full")
                        .queryParam("alternatives", accessible)
                        .queryParam("access_token", properties.mapboxToken())
                        .build(coordinates))
                .retrieve().body(JsonNode.class);
    }

    private Optional<Response> parseMapbox(JsonNode body, boolean accessible) {
        if (body == null || !body.path("routes").isArray() || body.path("routes").isEmpty()) {
            return Optional.empty();
        }
        JsonNode routes = body.path("routes");
        int routeIndex = accessible && routes.size() > 1 ? 1 : 0;
        JsonNode route = routes.get(routeIndex);
        List<List<Double>> coordinates = new ArrayList<>();
        route.path("geometry").path("coordinates").forEach(point ->
                coordinates.add(List.of(point.get(0).asDouble(), point.get(1).asDouble())));
        return Optional.of(new Response(Math.round(route.path("distance").asDouble()),
                Math.round(route.path("duration").asDouble()), accessible,
                new Path("LineString", coordinates)));
    }

    private Response directRoute(Coordinate from, Coordinate to, boolean accessible) {
        long distance = Math.round(haversine(from, to) * (accessible ? 1.15 : 1));
        long duration = Math.round(distance / WALKING_METERS_PER_SECOND);
        Path path = new Path("LineString", List.of(
                List.of(from.lng(), from.lat()), List.of(to.lng(), to.lat())));
        return new Response(distance, duration, accessible, path);
    }

    private Coordinate destination(Long id, Double latitude, Double longitude) {
        if (latitude != null && longitude != null) {
            return new Coordinate(latitude, longitude);
        }
        if (id == null) {
            throw new NotFoundException("Destination coordinates or toId are required");
        }
        Point point = buildings.findById(id).map(b -> b.getGeom())
                .or(() -> pois.findById(id).map(poi -> poi.getGeom()))
                .orElseThrow(() -> new NotFoundException("Destination not found"));
        return new Coordinate(point.getY(), point.getX());
    }

    private double haversine(Coordinate from, Coordinate to) {
        double latDistance = Math.toRadians(to.lat() - from.lat());
        double lngDistance = Math.toRadians(to.lng() - from.lng());
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(from.lat())) * Math.cos(Math.toRadians(to.lat()))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private record Coordinate(double lat, double lng) { }
}
