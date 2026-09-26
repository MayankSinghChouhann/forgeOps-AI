package com.forgeops.backend.operation.controller;

import com.forgeops.backend.operation.dto.*;
import com.forgeops.backend.operation.entity.OperationStatus;
import com.forgeops.backend.operation.service.OperationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/operations")
@Validated
public class OperationController {
    private final OperationService operationService;

    public OperationController(OperationService operationService) {
        this.operationService = operationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('OPERATION_READ')")
    public Page<OperationResponse> list(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) OperationStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        return operationService.list(user.getUsername(), status, page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('OPERATION_READ')")
    public OperationResponse get(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        return operationService.get(user.getUsername(), id);
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAuthority('APPROVAL_DECIDE')")
    public OperationResponse decide(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id,
                                    @Valid @RequestBody ApprovalDecisionRequest request) {
        return operationService.decide(user.getUsername(), id, request);
    }

    @PostMapping("/{id}/execution/start")
    @PreAuthorize("hasAuthority('OPERATION_EXECUTE')")
    public ExecutionHandoffResponse start(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id,
                                          @Valid @RequestBody ExecutionStartRequest request) {
        return operationService.startExecution(user.getUsername(), id, request);
    }

    @PostMapping("/{id}/execution/result")
    @PreAuthorize("hasAuthority('OPERATION_EXECUTE')")
    public OperationResponse complete(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id,
                                      @Valid @RequestBody ExecutionResultRequest request) {
        return operationService.completeExecution(user.getUsername(), id, request);
    }
}
