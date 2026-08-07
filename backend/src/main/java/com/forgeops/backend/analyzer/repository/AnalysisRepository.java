package com.forgeops.backend.analyzer.repository;

import com.forgeops.backend.analyzer.entity.AnalysisRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalysisRepository extends JpaRepository<AnalysisRecord, UUID> {
    List<AnalysisRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<AnalysisRecord> findByTargetTypeOrderByCreatedAtDesc(String targetType);
}
