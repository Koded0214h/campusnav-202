package com.campusnav.admin;

import com.campusnav.pin.PinDtos.*;
import com.campusnav.pin.PinStatus;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/pins")
public class PinModerationController {
    private final PinModerationService service;

    public PinModerationController(PinModerationService service) { this.service = service; }

    @GetMapping
    public List<View> list(@RequestParam(defaultValue = "pending") PinStatus status) {
        return service.list(status);
    }

    @PostMapping("/{id}/approve")
    public ApprovalResponse approve(@PathVariable Long id, @RequestBody ApprovalRequest request,
                                    @AuthenticationPrincipal Jwt jwt) {
        return service.approve(id, request, jwt.getSubject());
    }

    @PostMapping("/{id}/reject")
    public View reject(@PathVariable Long id, @Valid @RequestBody RejectionRequest request,
                       @AuthenticationPrincipal Jwt jwt) {
        return service.reject(id, request.reason(), jwt.getSubject());
    }
}
