package com.campusnav.pin;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.campusnav.pin.PinDtos.SubmissionResponse;
import static com.campusnav.pin.PinDtos.View;

@RestController
@RequestMapping("/api/pins")
public class PinController {

    private final PinService service;

    public PinController(PinService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionResponse submit(@Valid @RequestBody PinRequest request) {
        return service.submit(request);
    }

    @GetMapping("/approved")
    public List<View> approved() {
        return service.approved();
    }
}
