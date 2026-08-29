package com.campusnav.admin;

import com.campusnav.common.NotFoundException;
import com.campusnav.location.Alias;
import com.campusnav.location.AliasRepository;
import com.campusnav.location.Building;
import com.campusnav.location.BuildingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.campusnav.admin.BuildingDtos.Deleted;
import static com.campusnav.admin.BuildingDtos.Request;
import static com.campusnav.admin.BuildingDtos.View;

@Service
public class AdminBuildingService {
    private final BuildingRepository buildings;
    private final AliasRepository aliases;

    public AdminBuildingService(BuildingRepository buildings, AliasRepository aliases) {
        this.buildings = buildings;
        this.aliases = aliases;
    }

    @Transactional(readOnly = true)
    public List<View> list() {
        return buildings.findAll().stream().map(this::view).toList();
    }

    @Transactional
    public View create(Request request) {
        Building building = Building.create(request.name().trim(), normalize(request.officialCode()),
                request.category(), request.description(), request.lat(), request.lng());
        Building saved = buildings.save(building);
        saveAliases(saved, request.aliases());
        return view(saved);
    }

    @Transactional
    public View update(Long id, Request request) {
        Building building = find(id);
        building.update(request.name().trim(), normalize(request.officialCode()), request.category(),
                request.description(), request.lat(), request.lng());
        aliases.deleteByBuildingId(id);
        saveAliases(building, request.aliases());
        return view(building);
    }

    @Transactional
    public Deleted delete(Long id) {
        buildings.delete(find(id));
        return new Deleted(id, true);
    }

    private Building find(Long id) {
        return buildings.findById(id)
                .orElseThrow(() -> new NotFoundException("Building not found"));
    }

    private void saveAliases(Building building, List<String> requestedAliases) {
        requestedAliases.stream().map(String::trim).filter(alias -> !alias.isEmpty()).distinct()
                .map(alias -> new Alias(building, alias)).forEach(aliases::save);
    }

    private View view(Building building) {
        List<String> names = aliases.findByBuildingIdOrderByAliasText(building.getId()).stream()
                .map(Alias::getAliasText).toList();
        return new View(building.getId(), building.getName(), building.getOfficialCode(),
                building.getCategory(), building.getDescription(), building.getGeom().getY(),
                building.getGeom().getX(), names);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
