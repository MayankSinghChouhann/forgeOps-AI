package com.forgeops.backend.auth.service;

import com.forgeops.backend.audit.service.AuditService;
import com.forgeops.backend.auth.dto.UserResponse;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.common.exception.BusinessRuleViolationException;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class UserAdministrationService {
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public UserAdministrationService(UserRepository userRepository, CurrentUserService currentUserService,
                                     AuditService auditService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> list(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(this::toResponse);
    }

    @Transactional
    public UserResponse changeRole(String actorEmail, Long userId, UserRole newRole) {
        User actor = currentUserService.requireByEmail(actorEmail);
        User target = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserRole previous = target.getRole();
        if (previous == newRole) return toResponse(target);
        if (target.getId().equals(actor.getId())) {
            throw new BusinessRuleViolationException("Administrators cannot change their own role.");
        }
        if (previous == UserRole.ADMIN && userRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new BusinessRuleViolationException("The final administrator cannot be demoted.");
        }
        target.setRole(newRole);
        userRepository.save(target);
        auditService.record(actor, "USER_ROLE_CHANGED", "USER", target.getId(), true,
                Map.of("target", target.getEmail(), "previousRole", previous, "newRole", newRole));
        return toResponse(target);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}
