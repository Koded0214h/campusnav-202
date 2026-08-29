package com.campusnav.location;

import java.util.List;

public final class LocationDtos {

    private LocationDtos() {
    }

    public record Summary(Long id, String type, String name, String category,
                          String matchedAlias, double lat, double lng) {
    }

    public record MapData(List<Summary> buildings, List<Summary> pois) {
    }

    public record FloorSummary(Long id, int floorNumber, String accessibilityNotes,
                               List<PoiSummary> pois) {
    }

    public record PoiSummary(Long id, String name, String category, double lat, double lng) {
    }

    public record Detail(Long id, String type, String name, String category,
                         String description, double lat, double lng,
                         List<String> aliases, List<FloorSummary> floors,
                         List<PoiSummary> pois) {
    }
}
