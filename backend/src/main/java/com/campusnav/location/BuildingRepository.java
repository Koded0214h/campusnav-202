package com.campusnav.location;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BuildingRepository extends JpaRepository<Building, Long> {

    @Query("""
            select distinct b from Building b
            left join Alias a on a.building = b
            where lower(b.name) like lower(concat('%', :query, '%'))
               or lower(coalesce(b.officialCode, '')) like lower(concat('%', :query, '%'))
               or lower(a.aliasText) like lower(concat('%', :query, '%'))
            order by b.name
            """)
    List<Building> search(@Param("query") String query, Pageable pageable);
}
