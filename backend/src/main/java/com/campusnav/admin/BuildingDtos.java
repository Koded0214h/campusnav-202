package com.campusnav.admin;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class BuildingDtos {
    private BuildingDtos() { }

    public record Request(
            @NotBlank @Size(max = 150) String name,
            @Size(max = 20) String officialCode,
            @NotBlank @Size(max = 50) String category,
            @Size(max = 5000) String description,
            @DecimalMin("-90") @DecimalMax("90") double lat,
            @DecimalMin("-180") @DecimalMax("180") double lng,
            @NotNull List<@NotBlank @Size(max = 150) String> aliases) { }

    public record View(Long id, String name, String officialCode, String category,
                       String description, double lat, double lng, List<String> aliases) { }

    public record Deleted(Long id, boolean deleted) { }
}
