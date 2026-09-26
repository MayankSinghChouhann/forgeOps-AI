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
import org.springframework.http.MediaType;
import org.springframework.core.task.TaskExecutor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.beans.factory.annotation.Qualifier;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/assistant")
@Validated
public class AssistantController {

    private final AssistantService assistantService;
    private final TaskExecutor aiTaskExecutor;

    public AssistantController(AssistantService assistantService,
                               @Qualifier("aiTaskExecutor") TaskExecutor aiTaskExecutor) {
        this.assistantService = assistantService;
        this.aiTaskExecutor = aiTaskExecutor;
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAuthority('AI_USE')")
    public ResponseEntity<List<ChatSessionResponse>> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int size) {
        List<ChatSessionResponse> sessions = assistantService.getUserSessions(
                userDetails.getUsername(), PageRequest.of(page, size));
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/sessions")
    @PreAuthorize("hasAuthority('AI_USE')")
    public ResponseEntity<ChatSessionResponse> createSession(@AuthenticationPrincipal UserDetails userDetails,
                                                             @Valid @RequestBody CreateSessionRequest request) {
        ChatSessionResponse session = assistantService.createSession(userDetails.getUsername(), request);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @PreAuthorize("hasAuthority('AI_USE')")
    public ResponseEntity<List<ChatMessageResponse>> getSessionMessages(@AuthenticationPrincipal UserDetails userDetails,
                                                                        @PathVariable UUID sessionId,
                                                                        @RequestParam(defaultValue = "0") @Min(0) int page,
                                                                        @RequestParam(defaultValue = "100") @Min(1) @Max(200) int size) {
        List<ChatMessageResponse> messages = assistantService.getSessionMessages(
                userDetails.getUsername(), sessionId, PageRequest.of(page, size));
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAuthority('AI_USE')")
    public ResponseEntity<ChatMessageResponse> sendMessage(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody SendMessageRequest request) {
        ChatMessageResponse response = assistantService.sendMessage(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAuthority('AI_USE')")
    public SseEmitter streamMessage(@AuthenticationPrincipal UserDetails userDetails,
                                    @Valid @RequestBody SendMessageRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);
        aiTaskExecutor.execute(() -> {
            try {
                ChatMessageResponse response = assistantService.sendMessage(userDetails.getUsername(), request);
                emitter.send(SseEmitter.event().name("message").data(response));
                emitter.send(SseEmitter.event().name("complete").data("done"));
                emitter.complete();
            } catch (Exception exception) {
                emitter.completeWithError(exception);
            }
        });
        return emitter;
    }

    @DeleteMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAuthority('AI_USE')")
    public ResponseEntity<Void> deleteSession(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable UUID sessionId) {
        assistantService.deleteSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.noContent().build();
    }
}
