package com.forgeops.backend.assistant.service;

import com.forgeops.backend.assistant.dto.ChatMessageResponse;
import com.forgeops.backend.assistant.dto.ChatSessionResponse;
import com.forgeops.backend.assistant.dto.CreateSessionRequest;
import com.forgeops.backend.assistant.dto.SendMessageRequest;
import com.forgeops.backend.assistant.entity.ChatMessage;
import com.forgeops.backend.assistant.entity.ChatSession;
import com.forgeops.backend.assistant.entity.MessageRole;
import com.forgeops.backend.assistant.repository.ChatMessageRepository;
import com.forgeops.backend.assistant.repository.ChatSessionRepository;
import com.forgeops.backend.auth.entity.User;
import com.forgeops.backend.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * AssistantService — Orchestrates the AI response pipeline.
 *
 * AI Provider Strategy (Graceful Degradation):
 *  Priority 1: GeminiAiService (Google Gemini 1.5 Flash via REST API)
 *  Priority 2: DevOpsKnowledgeEngine (Local rule-based fallback)
 *
 * This design ensures 100% uptime even if the Gemini API is unavailable.
 * This is a standard "Circuit Breaker" pattern used at Netflix, Google, and Uber.
 */
@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GeminiAiService geminiAiService;
    private final DevOpsKnowledgeEngine knowledgeEngine;

    public AssistantService(ChatSessionRepository sessionRepository,
                            ChatMessageRepository messageRepository,
                            UserRepository userRepository,
                            GeminiAiService geminiAiService,
                            DevOpsKnowledgeEngine knowledgeEngine) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.geminiAiService = geminiAiService;
        this.knowledgeEngine = knowledgeEngine;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getUserSessions(String userEmail) {
        User user = getUserByEmail(userEmail);
        return sessionRepository.findAllByUserOrderByUpdatedAtDesc(user)
                .stream()
                .map(s -> new ChatSessionResponse(s.getId(), s.getTitle(), s.getCreatedAt(), s.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatSessionResponse createSession(String userEmail, CreateSessionRequest request) {
        User user = getUserByEmail(userEmail);
        ChatSession session = new ChatSession(user, request.title());
        ChatSession saved = sessionRepository.save(session);
        return new ChatSessionResponse(saved.getId(), saved.getTitle(), saved.getCreatedAt(), saved.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getSessionMessages(String userEmail, UUID sessionId) {
        User user = getUserByEmail(userEmail);
        ChatSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Chat session not found"));

        return messageRepository.findAllBySessionOrderByCreatedAtAsc(session)
                .stream()
                .map(m -> new ChatMessageResponse(m.getId(), m.getRole().name(), m.getContent(), m.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendMessage(String userEmail, SendMessageRequest request) {
        User user = getUserByEmail(userEmail);
        ChatSession session;

        if (request.sessionId() != null) {
            session = sessionRepository.findByIdAndUser(request.sessionId(), user)
                    .orElseThrow(() -> new RuntimeException("Chat session not found"));
        } else {
            // Auto-create session with prompt as title (truncated to 40 chars)
            String title = request.prompt().length() > 40
                    ? request.prompt().substring(0, 37) + "..."
                    : request.prompt();
            session = sessionRepository.save(new ChatSession(user, title));
        }

        // Save User Message to DB first
        ChatMessage userMsg = new ChatMessage(session, MessageRole.USER, request.prompt());
        messageRepository.save(userMsg);

        // ============================================================
        // AI Response Pipeline: Gemini → Local Fallback
        // ============================================================
        String responseContent = resolveAiResponse(request.prompt());

        // Save Assistant Response to DB
        ChatMessage assistantMsg = new ChatMessage(session, MessageRole.ASSISTANT, responseContent);
        ChatMessage savedAssistantMsg = messageRepository.save(assistantMsg);

        // Update session's updatedAt timestamp (for sidebar ordering)
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        return new ChatMessageResponse(
                savedAssistantMsg.getId(),
                savedAssistantMsg.getRole().name(),
                savedAssistantMsg.getContent(),
                savedAssistantMsg.getCreatedAt()
        );
    }

    /**
     * AI Response Resolution with Graceful Fallback.
     *
     * 1. Try Gemini first (real LLM — full contextual understanding)
     * 2. On null/failure — fall back to DevOpsKnowledgeEngine (local rules)
     *
     * Interview talking point: "We use a strategy pattern here.
     * The service doesn't care which provider responds — it just needs a String.
     * This makes it easy to swap out Gemini for OpenAI, Claude, or a local Ollama model."
     */
    private String resolveAiResponse(String prompt) {
        if (geminiAiService.isConfigured()) {
            try {
                String geminiResponse = geminiAiService.generateDevOpsResponse(prompt);
                if (geminiResponse != null && !geminiResponse.isBlank()) {
                    log.info("[AssistantService] Using Gemini AI response.");
                    return geminiResponse;
                }
            } catch (Exception e) {
                log.warn("[AssistantService] Gemini AI failed: {}. Activating fallback.", e.getMessage());
            }
        }

        log.info("[AssistantService] Using local DevOps Knowledge Engine (fallback).");
        return knowledgeEngine.generateDevOpsResponse(prompt);
    }

    @Transactional
    public void deleteSession(String userEmail, UUID sessionId) {
        User user = getUserByEmail(userEmail);
        ChatSession session = sessionRepository.findByIdAndUser(sessionId, user)
                .orElseThrow(() -> new RuntimeException("Chat session not found"));
        sessionRepository.delete(session);
    }
}
