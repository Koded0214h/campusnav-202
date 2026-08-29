package com.campusnav.admin;

import com.campusnav.common.ConflictException;
import com.campusnav.common.NotFoundException;
import com.campusnav.location.*;
import com.campusnav.pin.*;
import com.campusnav.security.Admin;
import com.campusnav.security.AdminRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.campusnav.pin.PinDtos.*;

@Service
public class PinModerationService {
    private final PinRepository pins;
    private final PinService pinViews;
    private final AdminRepository admins;
    private final BuildingRepository buildings;
    private final AliasRepository aliases;
    private final PoiRepository pois;
    private final FloorRepository floors;

    public PinModerationService(PinRepository pins, PinService pinViews, AdminRepository admins,
                                BuildingRepository buildings, AliasRepository aliases,
                                PoiRepository pois, FloorRepository floors) {
        this.pins = pins;
        this.pinViews = pinViews;
        this.admins = admins;
        this.buildings = buildings;
        this.aliases = aliases;
        this.pois = pois;
        this.floors = floors;
    }

    @Transactional(readOnly = true)
    public List<View> list(PinStatus status) {
        return pins.findByStatusOrderBySubmittedAtDesc(status).stream()
                .map(pinViews::view).toList();
    }

    @Transactional
    public ApprovalResponse approve(Long id, ApprovalRequest request, String adminEmail) {
        PinSubmission pin = pendingPin(id);
        Long entityId = createEntity(pin, request);
        pin.approve(admin(adminEmail));
        return new ApprovalResponse(id, pin.getStatus(), entityId);
    }

    @Transactional
    public View reject(Long id, String reason, String adminEmail) {
        PinSubmission pin = pendingPin(id);
        pin.reject(admin(adminEmail), reason.trim());
        return pinViews.view(pin);
    }

    private Long createEntity(PinSubmission pin, ApprovalRequest request) {
        if (request.asType() == null) {
            throw new ConflictException("asType is required");
        }
        return switch (request.asType()) {
            case building -> createBuilding(pin);
            case poi -> createPoi(pin, request.targetBuildingId(), request.floorId());
            case alias -> createAlias(pin, request.targetBuildingId());
        };
    }

    private Long createBuilding(PinSubmission pin) {
        Building saved = buildings.save(Building.create(pin.getSuggestedName(), null, category(pin),
                pin.getNote(), pin.getGeom().getY(), pin.getGeom().getX()));
        saveSuggestedAlias(pin, saved);
        return saved.getId();
    }

    private void saveSuggestedAlias(PinSubmission pin, Building building) {
        if (pin.getAliasText() != null && !pin.getAliasText().isBlank()) {
            aliases.save(new Alias(building, pin.getAliasText().trim()));
        }
    }

    private Long createPoi(PinSubmission pin, Long buildingId, Long floorId) {
        Building building = buildingId == null ? null : building(buildingId);
        Floor floor = floorId == null ? null : floor(floorId);
        validateFloorBuilding(building, floor);
        Poi poi = Poi.create(pin.getSuggestedName(), category(pin), pin.getGeom().getY(),
                pin.getGeom().getX(), building, floor);
        return pois.save(poi).getId();
    }

    private Long createAlias(PinSubmission pin, Long buildingId) {
        if (buildingId == null) {
            throw new ConflictException("targetBuildingId is required when approving an alias");
        }
        String text = pin.getAliasText() == null ? pin.getSuggestedName() : pin.getAliasText();
        return aliases.save(new Alias(building(buildingId), text.trim())).getId();
    }

    private void validateFloorBuilding(Building building, Floor floor) {
        if (floor != null && building != null && !floor.getBuilding().getId().equals(building.getId())) {
            throw new ConflictException("Floor does not belong to the selected building");
        }
    }

    private PinSubmission pendingPin(Long id) {
        PinSubmission pin = pins.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Pin not found"));
        if (pin.getStatus() != PinStatus.pending) {
            throw new ConflictException("Only pending pins can be reviewed");
        }
        return pin;
    }

    private Admin admin(String email) {
        return admins.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Admin not found"));
    }

    private Building building(Long id) {
        return buildings.findById(id)
                .orElseThrow(() -> new NotFoundException("Target building not found"));
    }

    private Floor floor(Long id) {
        return floors.findById(id)
                .orElseThrow(() -> new NotFoundException("Floor not found"));
    }

    private String category(PinSubmission pin) {
        return pin.getSuggestedCategory() == null ? "other" : pin.getSuggestedCategory();
    }
}
