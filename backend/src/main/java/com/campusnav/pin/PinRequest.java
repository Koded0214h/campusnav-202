package com.campusnav.pin;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PinRequest(
        @DecimalMin("-90") @DecimalMax("90") double lat,
        @DecimalMin("-180") @DecimalMax("180") double lng,
        @NotBlank @Size(max = 150) String suggestedName,
        @Size(max = 50) String suggestedCategory,
        @Size(max = 150) String aliasText,
        @Size(max = 280) String note,
        @NotBlank @Size(max = 100) String deviceId
) {
}
