package com.forgeops.backend.assistant.repository;

import com.forgeops.backend.assistant.entity.ChatMessage;
import com.forgeops.backend.assistant.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findAllBySessionOrderByCreatedAtAsc(ChatSession session);
}
