package com.campusnav.pin;

import com.campusnav.common.ConflictException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.campusnav.pin.PinDtos.SubmissionResponse;
import static com.campusnav.pin.PinDtos.View;

@Service
public class PinService {

    private static final int MAX_PENDING_PER_DEVICE = 5;
    private final PinRepository pins;

    public PinService(PinRepository pins) {
        this.pins = pins;
    }

    @Transactional
    public SubmissionResponse submit(PinRequest request) {
        pins.lockDevice(request.deviceId());
        long pending = pins.countByDeviceIdAndStatus(request.deviceId(), PinStatus.pending);
        if (pending >= MAX_PENDING_PER_DEVICE) {
            throw new ConflictException("Too many pending submissions from this device");
        }
        PinSubmission saved = pins.save(PinSubmission.create(request));
        return new SubmissionResponse(saved.getId(), saved.getStatus(), "Submitted for review");
    }

    @Transactional(readOnly = true)
    public List<View> approved() {
        return pins.findByStatusOrderBySubmittedAtDesc(PinStatus.approved).stream()
                .map(this::view)
                .toList();
    }

    public View view(PinSubmission pin) {
        String reviewer = pin.getReviewedBy() == null ? null : pin.getReviewedBy().getEmail();
        return new View(pin.getId(), pin.getGeom().getY(), pin.getGeom().getX(),
                pin.getSuggestedName(), pin.getSuggestedCategory(), pin.getAliasText(), pin.getNote(),
                pin.getDeviceId(), pin.getStatus(), pin.getSubmittedAt(), reviewer,
                pin.getReviewedAt(), pin.getRejectionReason());
    }
}
