package com.campusnav.admin;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.campusnav.admin.BuildingDtos.*;

@RestController
@RequestMapping("/api/admin/buildings")
public class AdminBuildingController {
    private final AdminBuildingService service;

    public AdminBuildingController(AdminBuildingService service) { this.service = service; }

    @GetMapping
    public List<View> list() { return service.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public View create(@Valid @RequestBody Request request) { return service.create(request); }

    @PutMapping("/{id}")
    public View update(@PathVariable Long id, @Valid @RequestBody Request request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public Deleted delete(@PathVariable Long id) { return service.delete(id); }
}
