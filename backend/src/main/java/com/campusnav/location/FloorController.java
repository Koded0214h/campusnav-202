package com.campusnav.location;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.campusnav.location.LocationDtos.FloorSummary;

@RestController
@RequestMapping("/api/floors")
public class FloorController {
    private final LocationService service;

    public FloorController(LocationService service) { this.service = service; }

    @GetMapping("/{buildingId}")
    public List<FloorSummary> floors(@PathVariable Long buildingId) {
        return service.floors(buildingId);
    }
}
