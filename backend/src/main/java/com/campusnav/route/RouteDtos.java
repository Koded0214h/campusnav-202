package com.campusnav.route;

import java.util.List;

public final class RouteDtos {
    private RouteDtos() { }

    public record Path(String type, List<List<Double>> coordinates) { }

    public record Response(long distanceMeters, long durationSeconds,
                           boolean accessible, Path path) { }
}
