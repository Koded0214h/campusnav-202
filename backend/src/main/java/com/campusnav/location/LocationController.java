package com.campusnav.location;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.campusnav.location.LocationDtos.Detail;
import static com.campusnav.location.LocationDtos.FloorSummary;
import static com.campusnav.location.LocationDtos.MapData;
import static com.campusnav.location.LocationDtos.Summary;

@Validated
@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService service;

    public LocationController(LocationService service) {
        this.service = service;
    }

    @GetMapping
    public MapData mapData() {
        return service.mapData();
    }

    @GetMapping("/search")
    public List<Summary> search(
            @RequestParam @NotBlank @Size(max = 150) String q,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit) {
        return service.search(q, limit);
    }

    @GetMapping("/{id}")
    public Detail detail(@PathVariable Long id) {
        return service.buildingDetail(id);
    }

    @GetMapping("/pois/{id}")
    public Detail poiDetail(@PathVariable Long id) {
        return service.poiDetail(id);
    }

    @GetMapping("/{buildingId}/floors")
    public List<FloorSummary> floors(@PathVariable Long buildingId) {
        return service.floors(buildingId);
    }
}
