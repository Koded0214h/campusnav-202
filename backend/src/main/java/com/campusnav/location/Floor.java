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

@Entity
@Table(name = "floors")
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @Column(name = "floor_number", nullable = false)
    private int floorNumber;

    @Column(name = "accessibility_notes")
    private String accessibilityNotes;

    protected Floor() {
    }

    public Long getId() { return id; }
    public Building getBuilding() { return building; }
    public int getFloorNumber() { return floorNumber; }
    public String getAccessibilityNotes() { return accessibilityNotes; }
}
