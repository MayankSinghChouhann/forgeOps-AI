package com.forgeops.backend.assistant.controller;

import com.forgeops.backend.assistant.dto.ChatMessageResponse;
import com.forgeops.backend.assistant.dto.ChatSessionResponse;
import com.forgeops.backend.assistant.dto.CreateSessionRequest;
import com.forgeops.backend.assistant.dto.SendMessageRequest;
import com.forgeops.backend.assistant.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionResponse>> getUserSessions(@AuthenticationPrincipal UserDetails userDetails) {
        List<ChatSessionResponse> sessions = assistantService.getUserSessions(userDetails.getUsername());
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionResponse> createSession(@AuthenticationPrincipal UserDetails userDetails,
                                                             @Valid @RequestBody CreateSessionRequest request) {
        ChatSessionResponse session = assistantService.createSession(userDetails.getUsername(), request);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getSessionMessages(@AuthenticationPrincipal UserDetails userDetails,
                                                                        @PathVariable UUID sessionId) {
        List<ChatMessageResponse> messages = assistantService.getSessionMessages(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatMessageResponse> sendMessage(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody SendMessageRequest request) {
        ChatMessageResponse response = assistantService.sendMessage(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable UUID sessionId) {
        assistantService.deleteSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.noContent().build();
    }
}
