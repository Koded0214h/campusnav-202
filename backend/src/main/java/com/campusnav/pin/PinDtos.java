package com.campusnav.pin;

import java.time.Instant;

public final class PinDtos {

    private PinDtos() {
    }

    public record SubmissionResponse(Long id, PinStatus status, String message) {
    }

    public record View(Long id, double lat, double lng, String suggestedName,
                       String suggestedCategory, String aliasText, String note,
                       String deviceId, PinStatus status, Instant submittedAt,
                       String reviewedBy, Instant reviewedAt, String rejectionReason) {
    }

    public record ApprovalRequest(ApprovalType asType, Long targetBuildingId, Long floorId) {
    }

    public record ApprovalResponse(Long id, PinStatus status, Long createdEntityId) {
    }

    public record RejectionRequest(@jakarta.validation.constraints.NotBlank
                                   @jakarta.validation.constraints.Size(max = 500) String reason) {
    }

    public enum ApprovalType {
        poi,
        building,
        alias
    }
}
