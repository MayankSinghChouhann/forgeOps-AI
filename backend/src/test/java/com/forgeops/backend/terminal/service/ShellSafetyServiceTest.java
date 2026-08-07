package com.forgeops.backend.terminal.service;

import com.forgeops.backend.assistant.service.GeminiAiService;
import com.forgeops.backend.terminal.dto.CommandExplanationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * ShellSafetyServiceTest — Unit Tests for the Destructive Command Guard Engine
 *
 * Testing Strategy:
 *  Parameterized tests (@ValueSource) are used for commands of the same
 *  danger category, avoiding test duplication (DRY principle).
 *
 *  Interview Tip:
 *  "Why do you test business logic, not Spring annotations?"
 *  → Because annotations are tested by Spring's own test suite.
 *    We test OUR logic: classification rules, flag extraction, AI integration.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShellSafetyService — Destructive Command Guard Unit Tests")
class ShellSafetyServiceTest {

    @Mock
    private GeminiAiService geminiAiService;

    @InjectMocks
    private ShellSafetyService shellSafetyService;

    // =====================================================================
    // DANGEROUS command detection
    // =====================================================================
    @Nested
    @DisplayName("DANGEROUS Command Classification")
    class DangerousCommandTests {

        @ParameterizedTest(name = "command: \"{0}\" → should be DANGEROUS")
        @ValueSource(strings = {
                "rm -rf /",
                "rm -rf /*",
                "rm -rf ~",
                "dd if=/dev/zero of=/dev/sda",
                "kill -9 1",
                "DROP DATABASE forgeops_db",
                "mkfs.ext4 /dev/sda"
        })
        @DisplayName("explainCommand: catastrophic system commands → classified as DANGEROUS")
        void explainCommand_GivenDestructiveCommand_ReturnsDangerousSafetyLevel(String dangerousCommand) {
            // Gemini NOT configured — we test local rule engine only
            when(geminiAiService.isConfigured()).thenReturn(false);

            CommandExplanationResponse response = shellSafetyService.explainCommand(dangerousCommand);

            assertThat(response.getSafetyLevel())
                    .as("Command '%s' should be classified as DANGEROUS", dangerousCommand)
                    .isEqualTo("DANGEROUS");
            assertThat(response.getSafeAlternative()).isNotNull();
            assertThat(response.getRiskExplanation()).containsIgnoringCase("CRITICAL RISK");
        }
    }

    // =====================================================================
    // CAUTION command detection
    // =====================================================================
    @Nested
    @DisplayName("CAUTION Command Classification")
    class CautionCommandTests {

        @ParameterizedTest(name = "command: \"{0}\" → should be CAUTION")
        @ValueSource(strings = {
                "docker system prune -a",
                "docker system prune --volumes",
                "git reset --hard HEAD~1",
                "git push --force origin main",
                "reboot",
                "shutdown -h now",
                "pkill -9 java"
        })
        @DisplayName("explainCommand: high-risk system commands → classified as CAUTION")
        void explainCommand_GivenHighRiskCommand_ReturnsCautionSafetyLevel(String cautionCommand) {
            when(geminiAiService.isConfigured()).thenReturn(false);

            CommandExplanationResponse response = shellSafetyService.explainCommand(cautionCommand);

            assertThat(response.getSafetyLevel())
                    .as("Command '%s' should be classified as CAUTION", cautionCommand)
                    .isEqualTo("CAUTION");
        }
    }

    // =====================================================================
    // SAFE command detection
    // =====================================================================
    @Nested
    @DisplayName("SAFE Command Classification")
    class SafeCommandTests {

        @ParameterizedTest(name = "command: \"{0}\" → should be SAFE")
        @ValueSource(strings = {
                "docker ps",
                "kubectl get pods",
                "ls -la /tmp",
                "cat /etc/hostname",
                "git status",
                "df -h",
                "free -m"
        })
        @DisplayName("explainCommand: read-only commands → classified as SAFE")
        void explainCommand_GivenReadOnlyCommand_ReturnsSafeSafetyLevel(String safeCommand) {
            when(geminiAiService.isConfigured()).thenReturn(false);

            CommandExplanationResponse response = shellSafetyService.explainCommand(safeCommand);

            assertThat(response.getSafetyLevel())
                    .as("Command '%s' should be classified as SAFE", safeCommand)
                    .isEqualTo("SAFE");
        }
    }

    // =====================================================================
    // Flag extraction
    // =====================================================================
    @Nested
    @DisplayName("Flag Extraction")
    class FlagExtractionTests {

        @Test
        @DisplayName("explainCommand: rm -rf → extracts -rf flag with explanation")
        void explainCommand_GivenCommandWithFlags_ExtractsFlagDetails() {
            when(geminiAiService.isConfigured()).thenReturn(false);

            CommandExplanationResponse response = shellSafetyService.explainCommand("rm -rf /tmp/test");

            assertThat(response.getFlags()).isNotEmpty();
            boolean hasRfFlag = response.getFlags().stream()
                    .anyMatch(f -> f.getFlag().equals("-rf") || f.getFlag().equals("-r") || f.getFlag().equals("-f"));
            assertThat(hasRfFlag).isTrue();
        }

        @Test
        @DisplayName("explainCommand: null input → returns SAFE with empty flags")
        void explainCommand_GivenNullCommand_DoesNotThrow() {
            when(geminiAiService.isConfigured()).thenReturn(false);

            // Should not throw NullPointerException
            assertThatNoException().isThrownBy(() -> {
                CommandExplanationResponse response = shellSafetyService.explainCommand(null);
                assertThat(response.getSafetyLevel()).isEqualTo("SAFE");
                assertThat(response.getCommand()).isEqualTo("");
            });
        }
    }

    // =====================================================================
    // Gemini AI enhancement
    // =====================================================================
    @Nested
    @DisplayName("Gemini AI Enhancement")
    class GeminiEnhancementTests {

        @Test
        @DisplayName("explainCommand: Gemini configured → AI summary overrides local summary")
        void explainCommand_GivenGeminiConfigured_UsesAiExplanation() {
            String command = "docker ps -a";
            String aiExplanation = "**AI Enhanced**: Lists all containers including stopped ones.";

            when(geminiAiService.isConfigured()).thenReturn(true);
            when(geminiAiService.generateDevOpsResponse(anyString())).thenReturn(aiExplanation);

            CommandExplanationResponse response = shellSafetyService.explainCommand(command);

            assertThat(response.getSummary()).isEqualTo(aiExplanation);
            verify(geminiAiService).generateDevOpsResponse(anyString());
        }

        @Test
        @DisplayName("explainCommand: Gemini throws → graceful fallback, safety level preserved")
        void explainCommand_GivenGeminiThrows_SafetyLevelStillCorrect() {
            // rm -rf / is DANGEROUS regardless of Gemini being up or down
            when(geminiAiService.isConfigured()).thenReturn(true);
            when(geminiAiService.generateDevOpsResponse(anyString()))
                    .thenThrow(new RuntimeException("API down"));

            CommandExplanationResponse response = shellSafetyService.explainCommand("rm -rf /");

            // Safety level classification happened BEFORE AI call — must still be DANGEROUS
            assertThat(response.getSafetyLevel()).isEqualTo("DANGEROUS");
        }
    }
}
