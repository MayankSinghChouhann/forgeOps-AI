package com.forgeops.backend.auth.security;

import com.forgeops.backend.auth.entity.UserRole;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RolePermissionsTest {
    @Test
    void viewerHasReadOnlyLeastPrivilege() {
        assertThat(RolePermissions.forRole(UserRole.VIEWER))
                .containsExactly(Permission.DASHBOARD_READ, Permission.OPERATION_READ)
                .doesNotContain(Permission.AI_USE, Permission.APPROVAL_DECIDE, Permission.USER_ADMIN);
    }

    @Test
    void approverCanDecideButCannotExecuteOrAdministerUsers() {
        assertThat(RolePermissions.forRole(UserRole.APPROVER))
                .contains(Permission.APPROVAL_DECIDE, Permission.EVALUATION_READ)
                .doesNotContain(Permission.OPERATION_EXECUTE, Permission.USER_ADMIN);
    }

    @Test
    void operatorCanCreateAndExecuteButCannotSelfGrantApproval() {
        assertThat(RolePermissions.forRole(UserRole.OPERATOR))
                .contains(Permission.COMMAND_RECOMMEND, Permission.OPERATION_EXECUTE)
                .doesNotContain(Permission.APPROVAL_DECIDE, Permission.AUDIT_READ);
    }
}
