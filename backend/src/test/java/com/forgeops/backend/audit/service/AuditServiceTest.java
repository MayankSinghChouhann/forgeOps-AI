package com.forgeops.backend.audit.service;

import com.forgeops.backend.audit.entity.AuditEvent;
import com.forgeops.backend.audit.repository.AuditEventRepository;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {
    @Mock AuditEventRepository repository;

    @Test
    void sensitiveMetadataIsRedactedBeforePersistence() {
        AuditService service = new AuditService(repository, JsonMapper.builder().build());
        User actor = new User("admin@forgeops.ai", "hash");
        actor.setRole(UserRole.ADMIN);

        service.record(actor, "TEST", "RESOURCE", "1", true,
                Map.of("apiKey", "top-secret", "passwordHint", "still-secret", "outcome", "ok"));

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getMetadata())
                .contains("[REDACTED]", "ok")
                .doesNotContain("top-secret", "still-secret");
    }
}
