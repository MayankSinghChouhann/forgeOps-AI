package com.forgeops.backend.operation.repository;

import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.operation.entity.OperationRequest;
import com.forgeops.backend.operation.entity.OperationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperationRequestRepository extends JpaRepository<OperationRequest, UUID> {
    Page<OperationRequest> findAllByRequester(User requester, Pageable pageable);
    Page<OperationRequest> findAllByStatus(OperationStatus status, Pageable pageable);
    long countByStatus(OperationStatus status);

    @Query("select avg(o.approvalTurnaroundMs) from OperationRequest o where o.approvalTurnaroundMs is not null")
    Double averageApprovalTurnaroundMs();

    @Query("select avg(o.executionLatencyMs) from OperationRequest o where o.executionLatencyMs is not null")
    Double averageExecutionLatencyMs();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OperationRequest o join fetch o.requester left join fetch o.approver where o.id = :id")
    Optional<OperationRequest> findByIdForUpdate(@Param("id") UUID id);

    @Query("select o from OperationRequest o join fetch o.requester left join fetch o.approver where o.id = :id")
    Optional<OperationRequest> findDetailedById(@Param("id") UUID id);
}
