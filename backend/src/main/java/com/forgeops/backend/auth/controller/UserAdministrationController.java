package com.forgeops.backend.auth.controller;

import com.forgeops.backend.auth.dto.UpdateRoleRequest;
import com.forgeops.backend.auth.dto.UserResponse;
import com.forgeops.backend.auth.service.UserAdministrationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@Validated
@PreAuthorize("hasAuthority('USER_ADMIN')")
public class UserAdministrationController {
    private final UserAdministrationService service;

    public UserAdministrationController(UserAdministrationService service) {
        this.service = service;
    }

    @GetMapping
    public Page<UserResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
                                   @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }

    @PatchMapping("/{id}/role")
    public UserResponse changeRole(@AuthenticationPrincipal UserDetails actor, @PathVariable Long id,
                                   @Valid @RequestBody UpdateRoleRequest request) {
        return service.changeRole(actor.getUsername(), id, request.role());
    }
}
