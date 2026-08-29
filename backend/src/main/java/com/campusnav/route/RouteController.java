package com.campusnav.route;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.campusnav.route.RouteDtos.Response;

@Validated
@RestController
@RequestMapping("/api/route")
public class RouteController {
    private final RouteService service;

    public RouteController(RouteService service) { this.service = service; }

    @GetMapping
    public Response route(
            @RequestParam @DecimalMin("-90") @DecimalMax("90") double fromLat,
            @RequestParam @DecimalMin("-180") @DecimalMax("180") double fromLng,
            @RequestParam(required = false) Long toId,
            @RequestParam(required = false) @DecimalMin("-90") @DecimalMax("90") Double toLat,
            @RequestParam(required = false) @DecimalMin("-180") @DecimalMax("180") Double toLng,
            @RequestParam(defaultValue = "false") boolean accessible) {
        return service.route(fromLat, fromLng, toId, toLat, toLng, accessible);
    }
}
