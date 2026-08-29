package com.campusnav.location;

import com.campusnav.common.NotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static com.campusnav.location.LocationDtos.Detail;
import static com.campusnav.location.LocationDtos.FloorSummary;
import static com.campusnav.location.LocationDtos.MapData;
import static com.campusnav.location.LocationDtos.PoiSummary;
import static com.campusnav.location.LocationDtos.Summary;

@Service
@Transactional(readOnly = true)
public class LocationService {

    private final BuildingRepository buildings;
    private final AliasRepository aliases;
    private final FloorRepository floors;
    private final PoiRepository pois;

    public LocationService(BuildingRepository buildings, AliasRepository aliases,
                           FloorRepository floors, PoiRepository pois) {
        this.buildings = buildings;
        this.aliases = aliases;
        this.floors = floors;
        this.pois = pois;
    }

    public MapData mapData() {
        List<Summary> buildingData = buildings.findAll().stream()
                .map(building -> summary(building, null))
                .toList();
        List<Summary> poiData = pois.findAll().stream().map(this::summary).toList();
        return new MapData(buildingData, poiData);
    }

    public List<Summary> search(String query, int limit) {
        int safeLimit = Math.clamp(limit, 1, 50);
        PageRequest page = PageRequest.of(0, safeLimit);
        List<Summary> results = new ArrayList<>();
        buildings.search(query.trim(), page).stream()
                .map(building -> summary(building, matchedAlias(building.getId(), query)))
                .forEach(results::add);
        pois.findByNameContainingIgnoreCaseOrderByName(query.trim(), page).stream()
                .map(this::summary)
                .forEach(results::add);
        return results.stream()
                .sorted(Comparator.comparing(Summary::name))
                .limit(safeLimit)
                .toList();
    }

    public Detail buildingDetail(Long id) {
        Building building = buildings.findById(id)
                .orElseThrow(() -> new NotFoundException("Building not found"));
        List<String> aliasData = aliases.findByBuildingIdOrderByAliasText(id).stream()
                .map(Alias::getAliasText)
                .toList();
        List<FloorSummary> floorData = floors.findByBuildingIdOrderByFloorNumber(id).stream()
                .map(this::floorSummary)
                .toList();
        List<PoiSummary> poiData = pois.findByBuildingIdOrderByName(id).stream()
                .map(this::poiSummary)
                .toList();
        return new Detail(building.getId(), "building", building.getName(), building.getCategory(),
                building.getDescription(), building.getGeom().getY(), building.getGeom().getX(),
                aliasData, floorData, poiData);
    }

    public Detail poiDetail(Long id) {
        Poi poi = pois.findById(id)
                .orElseThrow(() -> new NotFoundException("POI not found"));
        return new Detail(poi.getId(), "poi", poi.getName(), poi.getCategory(), null,
                poi.getGeom().getY(), poi.getGeom().getX(), List.of(), List.of(), List.of());
    }

    public List<FloorSummary> floors(Long buildingId) {
        if (!buildings.existsById(buildingId)) {
            throw new NotFoundException("Building not found");
        }
        return floors.findByBuildingIdOrderByFloorNumber(buildingId).stream()
                .map(this::floorSummary)
                .toList();
    }

    private Summary summary(Building building, String matchedAlias) {
        return new Summary(building.getId(), "building", building.getName(), building.getCategory(),
                matchedAlias, building.getGeom().getY(), building.getGeom().getX());
    }

    private Summary summary(Poi poi) {
        return new Summary(poi.getId(), "poi", poi.getName(), poi.getCategory(), poi.getName(),
                poi.getGeom().getY(), poi.getGeom().getX());
    }

    private PoiSummary poiSummary(Poi poi) {
        return new PoiSummary(poi.getId(), poi.getName(), poi.getCategory(),
                poi.getGeom().getY(), poi.getGeom().getX());
    }

    private FloorSummary floorSummary(Floor floor) {
        List<PoiSummary> floorPois = pois.findByFloorIdOrderByName(floor.getId()).stream()
                .map(this::poiSummary)
                .toList();
        return new FloorSummary(floor.getId(), floor.getFloorNumber(),
                floor.getAccessibilityNotes(), floorPois);
    }

    private String matchedAlias(Long buildingId, String query) {
        String normalized = query.trim().toLowerCase();
        return aliases.findByBuildingIdOrderByAliasText(buildingId).stream()
                .map(Alias::getAliasText)
                .filter(alias -> alias.toLowerCase().contains(normalized))
                .findFirst()
                .orElse(null);
    }
}
