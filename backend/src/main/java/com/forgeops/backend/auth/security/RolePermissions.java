package com.forgeops.backend.auth.security;

import com.forgeops.backend.auth.entity.UserRole;

import java.util.EnumSet;
import java.util.Set;

public final class RolePermissions {
    private RolePermissions() {}

    public static Set<Permission> forRole(UserRole role) {
        return switch (role) {
            case ADMIN -> EnumSet.allOf(Permission.class);
            case OPERATOR -> EnumSet.of(
                    Permission.DASHBOARD_READ,
                    Permission.AI_USE,
                    Permission.ANALYSIS_RUN,
                    Permission.TEMPLATE_GENERATE,
                    Permission.COMMAND_RECOMMEND,
                    Permission.OPERATION_READ,
                    Permission.OPERATION_EXECUTE);
            case APPROVER -> EnumSet.of(
                    Permission.DASHBOARD_READ,
                    Permission.OPERATION_READ,
                    Permission.APPROVAL_DECIDE,
                    Permission.EVALUATION_READ);
            case VIEWER -> EnumSet.of(
                    Permission.DASHBOARD_READ,
                    Permission.OPERATION_READ);
        };
    }
}
