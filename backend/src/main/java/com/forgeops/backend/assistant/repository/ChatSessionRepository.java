package com.forgeops.backend.assistant.repository;

import com.forgeops.backend.assistant.entity.ChatSession;
import com.forgeops.backend.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findAllByUserOrderByUpdatedAtDesc(User user, Pageable pageable);
    Optional<ChatSession> findByIdAndUser(UUID id, User user);
    List<ChatSession> findTop8ByOrderByCreatedAtDesc();
    List<ChatSession> findTop8ByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
}
