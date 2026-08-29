package com.campusnav.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

import static com.campusnav.common.GeoPoints.from;

@Entity
@Table(name = "buildings")
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "official_code", length = 20)
    private String officialCode;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point geom;

    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Building() {
    }

    public static Building create(String name, String officialCode, String category,
                                  String description, double lat, double lng) {
        Building building = new Building();
        building.name = name;
        building.officialCode = officialCode;
        building.category = category;
        building.description = description;
        building.geom = from(lat, lng);
        building.createdAt = Instant.now();
        building.updatedAt = building.createdAt;
        return building;
    }

    public void update(String name, String officialCode, String category,
                       String description, double lat, double lng) {
        this.name = name;
        this.officialCode = officialCode;
        this.category = category;
        this.description = description;
        this.geom = from(lat, lng);
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getOfficialCode() { return officialCode; }
    public String getCategory() { return category; }
    public Point getGeom() { return geom; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
