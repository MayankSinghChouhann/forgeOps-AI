package com.forgeops.backend.analyzer.service;

import com.forgeops.backend.analyzer.dto.AnalysisResponse;
import com.forgeops.backend.analyzer.dto.AnalyzeLogRequest;
import com.forgeops.backend.analyzer.entity.AnalysisRecord;
import com.forgeops.backend.analyzer.repository.AnalysisRepository;
import com.forgeops.backend.assistant.service.GeminiAiService;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * LogAnalyzerServiceTest — Unit Tests for the Root Cause Analysis Engine
 *
 * Testing Strategy:
 *  - @ExtendWith(MockitoExtension.class): uses Mockito for dependency mocking
 *    without loading the full Spring context (much faster than @SpringBootTest)
 *  - We test the SERVICE layer, not the controller or repository
 *  - External dependencies (GeminiAiService, AnalysisRepository) are MOCKED
 *    to isolate the unit under test
 *
 * Why this matters in interviews:
 *  "What is a unit test?" — A test that verifies a single class in isolation,
 *   with all external dependencies replaced by test doubles (mocks/stubs).
 *
 * Test Naming Convention: methodName_GivenState_ExpectedBehavior
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LogAnalyzerService — RCA Engine Unit Tests")
class LogAnalyzerServiceTest {

    @Mock
    private AnalysisRepository analysisRepository;

    @Mock
    private GeminiAiService geminiAiService;

    @InjectMocks
    private LogAnalyzerService logAnalyzerService;

    // =====================================================================
    // Test 1 Group: Jenkins Log Classification
    // =====================================================================
    @Nested
    @DisplayName("Jenkins CI/CD Log Analysis")
    class JenkinsLogAnalysisTests {

        @Test
        @DisplayName("analyzeLog: Maven compilation failure → classified as HIGH severity with remediation script")
        void analyzeLog_GivenMavenCompilationFailure_ReturnsHighSeverityRCA() {
            // ARRANGE
            // A realistic Maven compilation error log snippet
            String jenkinsLog = """
                [ERROR] COMPILATION ERROR :
                [ERROR] /var/jenkins_home/workspace/my-app/src/main/java/com/example/Service.java:[42,23]
                [ERROR] cannot find symbol
                [ERROR]   symbol:   class UserDTO
                [ERROR]   location: class com.example.Service
                [INFO] BUILD FAILURE
                [INFO] Total time: 4.532 s
                """;

            AnalyzeLogRequest request = new AnalyzeLogRequest(jenkinsLog, "JENKINS", null);

            // Stub: Gemini is NOT configured → local expert engine is used
            when(geminiAiService.isConfigured()).thenReturn(false);

            // Stub: repository.save() returns the entity it was given (with an ID)
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(invocation -> {
                AnalysisRecord record = invocation.getArgument(0);
                // Simulate DB assigning an ID
                return new AnalysisRecord(
                        record.getUserId(),
                        record.getTargetType(),
                        record.getTitle(),
                        record.getRawLog(),
                        record.getErrorSummary(),
                        record.getRootCause(),
                        record.getFailureStage(),
                        record.getSeverity(),
                        record.getRemediationScript()
                );
            });

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response).isNotNull();
            assertThat(response.getSeverity()).isEqualTo("HIGH");
            assertThat(response.getFailureStage()).isEqualTo("Maven Compilation");
            assertThat(response.getErrorSummary()).contains("compilation failed");
            assertThat(response.getRemediationScript()).contains("mvn clean compile");
            assertThat(response.getTargetType()).isEqualTo("JENKINS");

            // Verify interactions
            verify(analysisRepository, times(1)).save(any(AnalysisRecord.class));
            verify(geminiAiService, times(1)).isConfigured();
            verifyNoMoreInteractions(geminiAiService); // AI should NOT be called when not configured
        }

        @Test
        @DisplayName("analyzeLog: NPM peer dependency conflict → classified with NPM resolution remediation")
        void analyzeLog_GivenNpmPeerDependencyConflict_ReturnsNpmRemediationScript() {
            // ARRANGE
            String npmLog = """
                npm ERR! code ERESOLVE
                npm ERR! ERESOLVE could not resolve
                npm ERR! While resolving: react-scripts@5.0.1
                npm ERR! Found: react@18.2.0
                npm ERR! peer react@"^17.0.0" from react-scripts@5.0.1
                npm ERR! Fix the upstream dependency conflict
                """;

            AnalyzeLogRequest request = new AnalyzeLogRequest(npmLog, "JENKINS", "Frontend Build Failure");
            when(geminiAiService.isConfigured()).thenReturn(false);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response.getFailureStage()).isEqualTo("NPM Package Resolution");
            assertThat(response.getRemediationScript()).contains("--legacy-peer-deps");
            assertThat(response.getTitle()).isEqualTo("Frontend Build Failure"); // custom title preserved
        }
    }

    // =====================================================================
    // Test 2 Group: Docker Log Classification
    // =====================================================================
    @Nested
    @DisplayName("Docker Container Error Analysis")
    class DockerLogAnalysisTests {

        @Test
        @DisplayName("analyzeLog: OOMKilled exit 137 → CRITICAL severity, Docker memory remediation")
        void analyzeLog_GivenDockerOomKilled_ReturnsCriticalSeverityWithMemoryScript() {
            // ARRANGE
            String dockerLog = """
                forgeops-backend | Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
                forgeops-backend exited with code 137
                OOMKilled: true
                """;

            AnalyzeLogRequest request = new AnalyzeLogRequest(dockerLog, "DOCKER", null);
            when(geminiAiService.isConfigured()).thenReturn(false);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response.getSeverity()).isEqualTo("CRITICAL");
            assertThat(response.getFailureStage()).isEqualTo("Container Runtime (cgroup)");
            assertThat(response.getRemediationScript()).contains("docker inspect");
            assertThat(response.getRemediationScript()).contains("MaxRAMPercentage");
        }

        @Test
        @DisplayName("analyzeLog: Port already in use → classified as port conflict with bind address remediation")
        void analyzeLog_GivenPortAlreadyInUse_ReturnsPortConflictDiagnosis() {
            // ARRANGE
            String dockerLog = "Error starting userland proxy: listen tcp 0.0.0.0:5432: bind: address already in use";

            AnalyzeLogRequest request = new AnalyzeLogRequest(dockerLog, "DOCKER", null);
            when(geminiAiService.isConfigured()).thenReturn(false);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response.getFailureStage()).isEqualTo("Network Port Binding");
            assertThat(response.getRemediationScript()).contains("docker compose down");
            assertThat(response.getRemediationScript()).contains("lsof");
        }
    }

    // =====================================================================
    // Test 3 Group: Kubernetes Log Classification
    // =====================================================================
    @Nested
    @DisplayName("Kubernetes Cluster Troubleshooting")
    class KubernetesLogAnalysisTests {

        @Test
        @DisplayName("analyzeLog: CrashLoopBackOff event → CRITICAL severity with kubectl --previous fix")
        void analyzeLog_GivenCrashLoopBackOff_ReturnsCriticalWithKubectlRemediation() {
            // ARRANGE
            String k8sLog = """
                Events:
                  Warning  BackOff    42s (x5 over 2m)  kubelet  Back-off restarting failed container
                  Normal   Pulled     2m                 kubelet  Container image pulled
                  Warning  Failed     2m                 kubelet  Error: CrashLoopBackOff
                """;

            AnalyzeLogRequest request = new AnalyzeLogRequest(k8sLog, "KUBERNETES", null);
            when(geminiAiService.isConfigured()).thenReturn(false);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response.getSeverity()).isEqualTo("CRITICAL");
            assertThat(response.getFailureStage()).isEqualTo("Pod Container Runtime");
            assertThat(response.getRemediationScript()).contains("kubectl logs");
            assertThat(response.getRemediationScript()).contains("--previous");
        }

        @Test
        @DisplayName("analyzeLog: ImagePullBackOff → classified with registry secret remediation")
        void analyzeLog_GivenImagePullBackOff_ReturnsRegistrySecretRemediation() {
            // ARRANGE
            String k8sLog = """
                Warning  Failed     2m  kubelet  Failed to pull image "registry.io/myapp:v1.0":
                         rpc error: code = Unknown desc = failed to pull and unpack image: ImagePullBackOff
                """;

            AnalyzeLogRequest request = new AnalyzeLogRequest(k8sLog, "KUBERNETES", null);
            when(geminiAiService.isConfigured()).thenReturn(false);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response.getFailureStage()).isEqualTo("Image Registry Pull");
            assertThat(response.getRemediationScript()).contains("imagePullSecrets");
        }
    }

    // =====================================================================
    // Test 4 Group: AI Enhancement Path
    // =====================================================================
    @Nested
    @DisplayName("Gemini AI Enhancement")
    class GeminiAiEnhancementTests {

        @Test
        @DisplayName("analyzeLog: When Gemini is configured → AI response overrides local rootCause")
        void analyzeLog_GivenGeminiConfigured_AiResponseOverridesLocalRootCause() {
            // ARRANGE
            String jenkinsLog = "BUILD FAILURE: compilation error in Service.java";
            AnalyzeLogRequest request = new AnalyzeLogRequest(jenkinsLog, "JENKINS", null);

            String mockAiResponse = "**AI Root Cause**: The Java compiler could not resolve the type 'Service'.";
            when(geminiAiService.isConfigured()).thenReturn(true);
            when(geminiAiService.generateDevOpsResponse(anyString())).thenReturn(mockAiResponse);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT
            assertThat(response.getRootCause()).isEqualTo(mockAiResponse);
            verify(geminiAiService, times(1)).generateDevOpsResponse(anyString());
        }

        @Test
        @DisplayName("analyzeLog: When Gemini throws exception → graceful fallback to local engine")
        void analyzeLog_GivenGeminiThrowsException_FallsBackToLocalEngine() {
            // ARRANGE — simulates Gemini API being down
            String jenkinsLog = "BUILD FAILURE: maven-compiler-plugin compilation error";
            AnalyzeLogRequest request = new AnalyzeLogRequest(jenkinsLog, "JENKINS", null);

            when(geminiAiService.isConfigured()).thenReturn(true);
            when(geminiAiService.generateDevOpsResponse(anyString()))
                    .thenThrow(new RuntimeException("Connection timeout"));
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT — should NOT throw, should fall back gracefully
            AnalysisResponse response = logAnalyzerService.analyzeLog(1L, request);

            // ASSERT — local engine still ran, we still get a valid response
            assertThat(response).isNotNull();
            assertThat(response.getFailureStage()).isEqualTo("Maven Compilation");
            assertThat(response.getSeverity()).isEqualTo("HIGH");
        }
    }

    // =====================================================================
    // Test 5 Group: Repository Queries
    // =====================================================================
    @Nested
    @DisplayName("Data Retrieval")
    class DataRetrievalTests {

        @Test
        @DisplayName("getAnalysisById: non-existent UUID → throws ResourceNotFoundException")
        void getAnalysisById_GivenNonExistentId_ThrowsResourceNotFoundException() {
            // ARRANGE
            UUID nonExistentId = UUID.randomUUID();
            when(analysisRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            // ACT + ASSERT
            assertThatThrownBy(() -> logAnalyzerService.getAnalysisById(nonExistentId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("AnalysisRecord");

            verify(analysisRepository, times(1)).findById(nonExistentId);
        }

        @Test
        @DisplayName("analyzeLog: ANSI escape codes in log → stripped before analysis")
        void analyzeLog_GivenLogWithAnsiCodes_StripsCodesBeforeProcessing() {
            // ARRANGE — simulate a real terminal log with ANSI color codes
            String ansiLog = "\u001B[31mERROR\u001B[0m compilation error: cannot find symbol\n" +
                             "\u001B[33mmaven-compiler-plugin\u001B[0m BUILD FAILURE";

            AnalyzeLogRequest request = new AnalyzeLogRequest(ansiLog, "JENKINS", null);
            when(geminiAiService.isConfigured()).thenReturn(false);
            when(analysisRepository.save(any(AnalysisRecord.class))).thenAnswer(inv -> {
                AnalysisRecord saved = inv.getArgument(0);
                // Verify ANSI codes were stripped from the stored rawLog
                assertThat(saved.getRawLog()).doesNotContain("\u001B[");
                assertThat(saved.getRawLog()).doesNotContain("\u001B[0m");
                return saved;
            });

            // ACT
            logAnalyzerService.analyzeLog(1L, request);

            // ASSERT — verify save was called with stripped log
            verify(analysisRepository).save(any(AnalysisRecord.class));
        }
    }
}
