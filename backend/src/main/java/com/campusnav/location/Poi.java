package com.campusnav.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Point;

import static com.campusnav.common.GeoPoints.from;

@Entity
@Table(name = "pois")
public class Poi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id")
    private Floor floor;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point geom;

    protected Poi() {
    }

    public static Poi create(String name, String category, double lat, double lng,
                             Building building, Floor floor) {
        Poi poi = new Poi();
        poi.name = name;
        poi.category = category;
        poi.geom = from(lat, lng);
        poi.building = building;
        poi.floor = floor;
        return poi;
    }

    public Long getId() { return id; }
    public Building getBuilding() { return building; }
    public Floor getFloor() { return floor; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public Point getGeom() { return geom; }
}
