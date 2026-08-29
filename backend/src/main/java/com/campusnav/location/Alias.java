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

import java.time.Instant;

@Entity
@Table(name = "aliases")
public class Alias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @Column(name = "alias_text", nullable = false, length = 150)
    private String aliasText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Alias() {
    }

    public Alias(Building building, String aliasText) {
        this.building = building;
        this.aliasText = aliasText;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Building getBuilding() { return building; }
    public String getAliasText() { return aliasText; }
}
