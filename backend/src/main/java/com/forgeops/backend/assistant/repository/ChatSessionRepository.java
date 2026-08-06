package com.forgeops.backend.assistant.repository;

import com.forgeops.backend.assistant.entity.ChatSession;
import com.forgeops.backend.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findAllByUserOrderByUpdatedAtDesc(User user);
    Optional<ChatSession> findByIdAndUser(UUID id, User user);
}
