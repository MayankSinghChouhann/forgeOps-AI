package com.forgeops.backend.evaluation.service;

import com.forgeops.backend.evaluation.dto.EvaluationMetricsResponse;
import com.forgeops.backend.operation.entity.OperationStatus;
import com.forgeops.backend.operation.repository.OperationRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EvaluationService {
    private final OperationRequestRepository repository;

    public EvaluationService(OperationRequestRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public EvaluationMetricsResponse current() {
        long total = repository.count();
        long pending = repository.countByStatus(OperationStatus.PENDING_APPROVAL);
        long approved = repository.countByStatus(OperationStatus.APPROVED);
        long rejected = repository.countByStatus(OperationStatus.REJECTED);
        long executing = repository.countByStatus(OperationStatus.EXECUTING);
        long succeeded = repository.countByStatus(OperationStatus.SUCCEEDED);
        long failed = repository.countByStatus(OperationStatus.FAILED);
        long expired = repository.countByStatus(OperationStatus.EXPIRED);
        long accepted = approved + executing + succeeded + failed;
        long humanDecisions = accepted + rejected;
        long completedExecutions = succeeded + failed;
        return new EvaluationMetricsResponse(
                total, pending, approved, rejected, executing, succeeded, failed, expired,
                humanDecisions == 0 ? null : (double) accepted / humanDecisions,
                completedExecutions == 0 ? null : (double) succeeded / completedExecutions,
                repository.averageApprovalTurnaroundMs(),
                repository.averageExecutionLatencyMs());
    }
}
