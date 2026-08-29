package com.campusnav.location;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoiRepository extends JpaRepository<Poi, Long> {
    List<Poi> findByBuildingIdOrderByName(Long buildingId);
    List<Poi> findByFloorIdOrderByName(Long floorId);
    List<Poi> findByNameContainingIgnoreCaseOrderByName(String query, Pageable pageable);
}
