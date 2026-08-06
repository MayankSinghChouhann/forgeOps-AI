package com.forgeops.backend.assistant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * GeminiAiService — Production Google Gemini Integration
 *
 * Architecture:
 *  - Uses Spring Boot 3.x native RestClient (no extra deps needed)
 *  - Gemini REST API: POST /v1beta/models/{model}:generateContent?key={apiKey}
 *  - Returns null if key is missing → AssistantService falls back to DevOpsKnowledgeEngine
 *  - DevOps System Prompt ensures structured RCA + remediation commands in every response
 *
 * Why no LangChain4j or extra Jackson dependency?
 *  - RestClient handles JSON serialization via Spring's auto-configured MappingJackson2HttpMessageConverter
 *  - We parse the raw String response with a targeted path extraction
 *  - Zero additional Maven dependencies added — leverages what Spring Boot already provides
 */
@Service
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);

    @Value("${forgeops.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${forgeops.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${forgeops.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    private final RestClient restClient;

    // ============================================================
    // DevOps System Instruction Prompt
    // This is injected as the first message to prime Gemini's behavior.
    // A custom system prompt is the key to getting deterministic,
    // structured DevOps responses — a standard RAG/LLM technique.
    // ============================================================
    private static final String DEVOPS_SYSTEM_INSTRUCTION =
        "You are ForgeOps AI — a Senior Staff Site Reliability Engineer (SRE) and DevOps Architect " +
        "with 15 years of experience at Google, Netflix, and Uber. " +
        "When a user asks a DevOps question or pastes logs/errors/manifests:\n" +
        "1. Start with a **Root Cause Analysis (RCA)** section using markdown bold headers.\n" +
        "2. Provide exact **remediation commands** in proper fenced code blocks with language tags " +
        "(bash, yaml, dockerfile, etc.).\n" +
        "3. Explain WHY each command works — teach, don't just provide.\n" +
        "4. Add a **Prevention Strategy** section at the end.\n" +
        "5. Format all output in clean GitHub-flavored Markdown.\n" +
        "6. If you detect a security risk, add a **⚠️ Security Warning** section.\n" +
        "Keep responses concise and actionable. No fluff.";

    public GeminiAiService() {
        this.restClient = RestClient.create();
    }

    /**
     * Primary method called by AssistantService.
     *
     * Returns null if API key is missing or blank → triggers graceful fallback.
     * Returns null on any API error → same graceful fallback.
     *
     * This pattern is called "Graceful Degradation" — a must-know concept for
     * distributed systems interviews.
     */
    public String generateDevOpsResponse(String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[GeminiAI] GEMINI_API_KEY is not configured. Falling back to local knowledge engine.");
            return null;
        }

        try {
            // Build full model path: normalize to always have 'models/' prefix
            // API Key format AQ.Ab requires v1beta endpoint with full model path
            String modelPath = model.startsWith("models/") ? model : "models/" + model;
            String url = baseUrl.replace("/models", "") + "/" + modelPath + ":generateContent?key=" + apiKey;

            // Build the Gemini API request payload (REST JSON format)
            // Structure: { contents: [ {role, parts: [{text}]} ] }
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("role", "user",
                           "parts", List.of(Map.of("text", DEVOPS_SYSTEM_INSTRUCTION))),
                    Map.of("role", "model",
                           "parts", List.of(Map.of("text",
                               "Understood. I am ForgeOps AI, your Senior SRE. Please describe your DevOps issue."))),
                    Map.of("role", "user",
                           "parts", List.of(Map.of("text", userPrompt)))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.4,
                    "maxOutputTokens", 2048,
                    "topP", 0.95
                )
            );

            log.info("[GeminiAI] Sending request to model: {}", model);

            // RestClient sends Java Maps as JSON automatically via Spring's Jackson converter
            String responseJson = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return extractTextFromGeminiResponse(responseJson);

        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests rateLimitEx) {
            log.warn("[GeminiAI] Rate limit exceeded (429). Free tier quota exhausted. " +
                     "Falling back to local knowledge engine. Retry after a few minutes or upgrade your plan.");
            return null; // Graceful fallback
        } catch (Exception e) {
            log.error("[GeminiAI] API call failed: {}. Falling back to local knowledge engine.", e.getMessage());
            return null; // Graceful fallback — never crash the application
        }
    }

    /**
     * Parse the Gemini REST response JSON and extract the generated text.
     *
     * Gemini response shape:
     * {
     *   "candidates": [{
     *     "content": {
     *       "parts": [{ "text": "...response here..." }],
     *       "role": "model"
     *     }
     *   }]
     * }
     *
     * We use simple regex/string parsing to avoid needing an external JSON parser.
     * In production, you'd use a dedicated Gemini Java SDK or LangChain4j.
     */
    private String extractTextFromGeminiResponse(String responseJson) {
        if (responseJson == null || responseJson.isBlank()) {
            log.warn("[GeminiAI] Empty response from Gemini API.");
            return null;
        }

        // Check for API error responses
        if (responseJson.contains("\"error\"")) {
            log.warn("[GeminiAI] Gemini API returned an error: {}", responseJson.substring(0, Math.min(300, responseJson.length())));
            return null;
        }

        // Extract "text" value from the first candidate's first part
        // Pattern: "text": "...content..."
        // We look for the pattern after "parts":[{"text":
        Pattern pattern = Pattern.compile("\"parts\":\\s*\\[\\s*\\{\\s*\"text\":\\s*\"(.*?)\"\\s*\\}");
        Matcher matcher = pattern.matcher(responseJson.replace("\n", "\\n"));

        // Skip the first match (it's the system instruction echo)
        // We need the LAST "parts" match which is the model response
        String lastMatch = null;
        while (matcher.find()) {
            lastMatch = matcher.group(1);
        }

        if (lastMatch != null && !lastMatch.isBlank()) {
            // Unescape JSON string sequences
            String unescaped = lastMatch
                .replace("\\n", "\n")
                .replace("\\t", "\t")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
            log.info("[GeminiAI] Response extracted successfully. Length: {} chars", unescaped.length());
            return unescaped;
        }

        log.warn("[GeminiAI] Could not extract text from Gemini response. Raw (first 500 chars): {}",
            responseJson.substring(0, Math.min(500, responseJson.length())));
        return null;
    }

    /**
     * Health check — useful for /actuator integrations and startup validation.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
