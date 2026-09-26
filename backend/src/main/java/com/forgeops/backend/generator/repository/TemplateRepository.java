package com.forgeops.backend.generator.repository;

import com.forgeops.backend.generator.entity.GeneratedTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TemplateRepository extends JpaRepository<GeneratedTemplate, UUID> {
    List<GeneratedTemplate> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<GeneratedTemplate> findByIdAndUserId(UUID id, Long userId);
    List<GeneratedTemplate> findTop8ByOrderByCreatedAtDesc();
    List<GeneratedTemplate> findTop8ByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
    List<GeneratedTemplate> findByTemplateTypeOrderByCreatedAtDesc(String templateType);
}
