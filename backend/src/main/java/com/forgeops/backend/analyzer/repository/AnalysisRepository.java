package com.forgeops.backend.analyzer.repository;

import com.forgeops.backend.analyzer.entity.AnalysisRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisRepository extends JpaRepository<AnalysisRecord, UUID> {
    List<AnalysisRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<AnalysisRecord> findByIdAndUserId(UUID id, Long userId);
    List<AnalysisRecord> findTop8ByOrderByCreatedAtDesc();
    List<AnalysisRecord> findTop8ByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
    List<AnalysisRecord> findByTargetTypeOrderByCreatedAtDesc(String targetType);
}
