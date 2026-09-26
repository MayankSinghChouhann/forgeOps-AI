package com.forgeops.backend.auth.service;

import com.forgeops.backend.audit.service.AuditService;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import com.forgeops.backend.auth.repository.UserRepository;
import com.forgeops.backend.common.exception.BusinessRuleViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAdministrationServiceTest {
    @Mock UserRepository userRepository;
    @Mock CurrentUserService currentUserService;
    @Mock AuditService auditService;
    private UserAdministrationService service;
    private User admin;

    @BeforeEach
    void setUp() {
        service = new UserAdministrationService(userRepository, currentUserService, auditService);
        admin = user(1L, "admin@forgeops.ai", UserRole.ADMIN);
    }

    @Test
    void administratorCannotChangeOwnRole() {
        when(currentUserService.requireByEmail(admin.getEmail())).thenReturn(admin);
        when(userRepository.findByIdForUpdate(admin.getId())).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.changeRole(admin.getEmail(), admin.getId(), UserRole.VIEWER))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("own role");
    }

    @Test
    void roleChangeIsServerControlledAndAudited() {
        User viewer = user(2L, "viewer@forgeops.ai", UserRole.VIEWER);
        when(currentUserService.requireByEmail(admin.getEmail())).thenReturn(admin);
        when(userRepository.findByIdForUpdate(viewer.getId())).thenReturn(Optional.of(viewer));

        var response = service.changeRole(admin.getEmail(), viewer.getId(), UserRole.OPERATOR);

        assertThat(response.role()).isEqualTo(UserRole.OPERATOR);
        verify(userRepository).save(viewer);
        verify(auditService).record(org.mockito.ArgumentMatchers.eq(admin),
                org.mockito.ArgumentMatchers.eq("USER_ROLE_CHANGED"),
                org.mockito.ArgumentMatchers.eq("USER"),
                org.mockito.ArgumentMatchers.eq(viewer.getId()),
                org.mockito.ArgumentMatchers.eq(true),
                org.mockito.ArgumentMatchers.anyMap());
    }

    private User user(long id, String email, UserRole role) {
        User user = new User(email, "hash");
        user.setId(id);
        user.setRole(role);
        return user;
    }
}
