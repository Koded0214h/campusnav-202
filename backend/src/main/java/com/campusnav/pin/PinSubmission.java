package com.campusnav.pin;

import com.campusnav.security.Admin;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

import static com.campusnav.common.GeoPoints.from;

@Entity
@Table(name = "pin_submissions")
public class PinSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point geom;
    @Column(name = "suggested_name", nullable = false, length = 150)
    private String suggestedName;
    @Column(name = "suggested_category", length = 50)
    private String suggestedCategory;
    @Column(name = "alias_text", length = 150)
    private String aliasText;
    private String note;
    @Column(name = "device_id", nullable = false, length = 100)
    private String deviceId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PinStatus status;
    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Admin reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    @Column(name = "rejection_reason")
    private String rejectionReason;

    protected PinSubmission() {
    }

    public static PinSubmission create(PinRequest request) {
        PinSubmission pin = new PinSubmission();
        pin.geom = from(request.lat(), request.lng());
        pin.suggestedName = request.suggestedName().trim();
        pin.suggestedCategory = request.suggestedCategory();
        pin.aliasText = request.aliasText();
        pin.note = request.note();
        pin.deviceId = request.deviceId();
        pin.status = PinStatus.pending;
        pin.submittedAt = Instant.now();
        return pin;
    }

    public void approve(Admin admin) {
        review(admin, PinStatus.approved);
        rejectionReason = null;
    }

    public void reject(Admin admin, String reason) {
        review(admin, PinStatus.rejected);
        rejectionReason = reason;
    }

    private void review(Admin admin, PinStatus nextStatus) {
        reviewedBy = admin;
        reviewedAt = Instant.now();
        status = nextStatus;
    }

    public Long getId() { return id; }
    public Point getGeom() { return geom; }
    public String getSuggestedName() { return suggestedName; }
    public String getSuggestedCategory() { return suggestedCategory; }
    public String getAliasText() { return aliasText; }
    public String getNote() { return note; }
    public String getDeviceId() { return deviceId; }
    public PinStatus getStatus() { return status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Admin getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public String getRejectionReason() { return rejectionReason; }
}
