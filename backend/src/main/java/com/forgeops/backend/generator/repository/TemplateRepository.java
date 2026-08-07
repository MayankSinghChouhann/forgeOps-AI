package com.forgeops.backend.generator.repository;

import com.forgeops.backend.generator.entity.GeneratedTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TemplateRepository extends JpaRepository<GeneratedTemplate, UUID> {
    List<GeneratedTemplate> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<GeneratedTemplate> findByTemplateTypeOrderByCreatedAtDesc(String templateType);
}
