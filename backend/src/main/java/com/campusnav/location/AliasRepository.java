package com.campusnav.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AliasRepository extends JpaRepository<Alias, Long> {
    List<Alias> findByBuildingIdOrderByAliasText(Long buildingId);
    void deleteByBuildingId(Long buildingId);
}
