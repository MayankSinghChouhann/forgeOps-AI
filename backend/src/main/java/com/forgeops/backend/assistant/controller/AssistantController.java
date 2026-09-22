package com.forgeops.backend.assistant.controller;

import com.forgeops.backend.assistant.dto.ChatMessageResponse;
import com.forgeops.backend.assistant.dto.ChatSessionResponse;
import com.forgeops.backend.assistant.dto.CreateSessionRequest;
import com.forgeops.backend.assistant.dto.SendMessageRequest;
import com.forgeops.backend.assistant.service.AssistantService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/assistant")
@Validated
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionResponse>> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        List<ChatSessionResponse> sessions = assistantService.getUserSessions(
                userDetails.getUsername(), PageRequest.of(page, size));
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
                                                                        @PathVariable UUID sessionId,
                                                                        @RequestParam(defaultValue = "0") @Min(0) int page,
                                                                        @RequestParam(defaultValue = "100") @Min(1) @Max(200) int size) {
        List<ChatMessageResponse> messages = assistantService.getSessionMessages(
                userDetails.getUsername(), sessionId, PageRequest.of(page, size));
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
