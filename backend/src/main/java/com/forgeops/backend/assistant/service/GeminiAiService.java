package com.forgeops.backend.assistant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);
    private static final String DEVOPS_SYSTEM_INSTRUCTION =
            "You are ForgeOps AI, a Senior Staff Site Reliability Engineer and DevOps Architect. " +
            "Stay within DevOps, cloud infrastructure, CI/CD, observability, security, and incident response. " +
            "For operational questions provide a concise root-cause analysis, exact remediation commands in " +
            "fenced code blocks, why the remediation works, a prevention strategy, and an explicit security " +
            "warning when relevant. Never claim that you executed a command or inspected infrastructure. " +
            "Use clean GitHub-flavored Markdown.";

    @Value("${forgeops.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${forgeops.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${forgeops.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    @Value("${forgeops.ai.gemini.max-attempts:3}")
    private int maxAttempts;

    @Value("${forgeops.ai.gemini.initial-backoff-ms:250}")
    private long initialBackoffMs;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiAiService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public String generateDevOpsResponse(String userPrompt) {
        return generateDevOpsResponse(List.of(new ConversationTurn("user", userPrompt)));
    }

    public String generateDevOpsResponse(List<ConversationTurn> conversation) {
        if (!isConfigured()) {
            log.warn("[GeminiAI] GEMINI_API_KEY is not configured. Falling back to the local engine.");
            return null;
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        for (ConversationTurn turn : conversation) {
            String role = "model".equalsIgnoreCase(turn.role()) ? "model" : "user";
            contents.add(Map.of("role", role, "parts", List.of(Map.of("text", turn.content()))));
        }

        Map<String, Object> requestBody = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", DEVOPS_SYSTEM_INSTRUCTION))),
                "contents", contents,
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", 2048,
                        "topP", 0.95
                )
        );

        String modelPath = model.startsWith("models/") ? model : "models/" + model;
        String url = baseUrl.replaceFirst("/models/?$", "") + "/" + modelPath + ":generateContent?key=" + apiKey;
        long backoff = Math.max(1, initialBackoffMs);
        int attempts = Math.max(1, maxAttempts);

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                log.info("[GeminiAI] Requesting model {} (attempt {}/{})", model, attempt, attempts);
                String responseJson = restClient.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);
                return extractText(responseJson);
            } catch (HttpClientErrorException.TooManyRequests exception) {
                if (attempt >= attempts) {
                    log.warn("[GeminiAI] Rate limit persisted after {} attempts; using fallback", attempt);
                    return null;
                }
                if (!sleepBeforeRetry(backoff)) return null;
                backoff = Math.min(backoff * 2, 4_000);
            } catch (Exception exception) {
                log.error("[GeminiAI] API request failed: {}. Using fallback.", exception.getMessage());
                return null;
            }
        }
        return null;
    }

    private boolean sleepBeforeRetry(long backoffMs) {
        try {
            Thread.sleep(backoffMs);
            return true;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("[GeminiAI] Retry interrupted; using fallback");
            return false;
        }
    }

    private String extractText(String responseJson) {
        if (responseJson == null || responseJson.isBlank()) return null;
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (text.isMissingNode() || text.isNull() || text.asText().isBlank()) {
                log.warn("[GeminiAI] Response did not contain candidate text");
                return null;
            }
            return text.asText();
        } catch (Exception exception) {
            log.warn("[GeminiAI] Could not parse provider response: {}", exception.getMessage());
            return null;
        }
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public record ConversationTurn(String role, String content) {}
}
