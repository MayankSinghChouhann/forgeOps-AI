package com.forgeops.backend.generator.service;

import com.forgeops.backend.assistant.service.GeminiAiService;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import com.forgeops.backend.generator.dto.GenerateTemplateRequest;
import com.forgeops.backend.generator.dto.TemplateResponse;
import com.forgeops.backend.generator.entity.GeneratedTemplate;
import com.forgeops.backend.generator.repository.TemplateRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * TemplateGeneratorServiceTest — Unit Tests for the IaC & Pipeline Generator
 *
 * Demonstrates:
 *  - @CsvSource for multi-argument parameterized tests
 *  - Testing template content assertions
 *  - Verifying AI fallback behaviour in generator service
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TemplateGeneratorService — IaC & Pipeline Generator Unit Tests")
class TemplateGeneratorServiceTest {

    @Mock
    private TemplateRepository templateRepository;

    @Mock
    private GeminiAiService geminiAiService;

    @InjectMocks
    private TemplateGeneratorService templateGeneratorService;

    // =====================================================================
    // Built-in template generation
    // =====================================================================
    @Nested
    @DisplayName("Built-in Template Generation")
    class BuiltInTemplateTests {

        @ParameterizedTest(name = "templateType={0}, provider={1} → should contain key content={2}")
        @CsvSource({
                "TERRAFORM,     AWS,     terraform",
                "KUBERNETES,    K8S,     apiVersion",
                "GITLAB_CI,     GENERIC, stages:",
                "GITHUB_ACTIONS,GENERIC, 'on:'",
                "HELM,          K8S,     replicaCount",
        })
        @DisplayName("generateTemplate: built-in templates contain expected YAML/HCL markers")
        void generateTemplate_GivenTemplateType_ReturnsExpectedContent(
                String templateType, String provider, String expectedContent) {
            // ARRANGE
            GenerateTemplateRequest request = new GenerateTemplateRequest();
            request.setTemplateType(templateType.trim());
            request.setTargetProvider(provider.trim());
            request.setServiceName("forgeops-app");
            request.setEnvironment("production");

            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            // ASSERT
            assertThat(response.getCodeContent())
                    .as("Template type '%s' should contain '%s'", templateType.trim(), expectedContent.trim())
                    .containsIgnoringCase(expectedContent.trim());
            assertThat(response.getTemplateType()).isEqualTo(templateType.trim().toUpperCase());
        }

        @Test
        @DisplayName("generateTemplate: Terraform template contains S3 remote state backend")
        void generateTemplate_GivenTerraformType_ContainsS3RemoteStateBackend() {
            // ARRANGE — a production Terraform template MUST have remote state
            // without it, team collaboration is impossible (state conflicts)
            GenerateTemplateRequest request = buildRequest("TERRAFORM", "AWS");
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            // ASSERT
            String code = response.getCodeContent();
            assertThat(code).contains("backend \"s3\"");
            assertThat(code).contains("dynamodb_table"); // State locking
            assertThat(code).contains("encrypt");        // Encryption at rest
        }

        @Test
        @DisplayName("generateTemplate: Kubernetes manifest contains liveness and readiness probes")
        void generateTemplate_GivenKubernetesType_ContainsHealthProbes() {
            // ARRANGE — production K8s manifests must have probes for traffic routing
            GenerateTemplateRequest request = buildRequest("KUBERNETES", "K8S");
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            // ASSERT
            String code = response.getCodeContent();
            assertThat(code).contains("livenessProbe");
            assertThat(code).contains("readinessProbe");
            assertThat(code).contains("resources"); // Resource limits must be present
        }

        @Test
        @DisplayName("generateTemplate: GitLab CI pipeline contains security scan stage")
        void generateTemplate_GivenGitLabCiType_ContainsSecurityScanStage() {
            // ARRANGE — pipelines without security scanning are not production-grade
            GenerateTemplateRequest request = buildRequest("GITLAB_CI", "GENERIC");
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            // ACT
            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            // ASSERT
            String code = response.getCodeContent();
            assertThat(code).contains("security");
            assertThat(code).contains("trivy"); // Container vulnerability scanner
        }

        @Test
        @DisplayName("generateTemplate: GitHub Actions pipeline pushes to GHCR")
        void generateTemplate_GivenGitHubActionsType_ContainsGhcrPush() {
            GenerateTemplateRequest request = buildRequest("GITHUB_ACTIONS", "GENERIC");
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            assertThat(response.getCodeContent())
                    .contains("ghcr.io")
                    .contains("GITHUB_TOKEN");
        }

        @Test
        @DisplayName("generateTemplate: Dockerfile for Node runtime → uses nginx:alpine runner")
        void generateTemplate_GivenNodeRuntime_ReturnsNginxDockerfile() {
            GenerateTemplateRequest request = buildRequest("DOCKERFILE", "GENERIC");
            request.setRuntime("node");
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            assertThat(response.getCodeContent())
                    .contains("nginx")
                    .contains("npm ci")
                    .contains("npm run build");
        }
    }

    // =====================================================================
    // AI-powered custom generation
    // =====================================================================
    @Nested
    @DisplayName("AI-Powered Custom Generation")
    class AiCustomGenerationTests {

        @Test
        @DisplayName("generateTemplate: custom prompt + Gemini configured → AI code is used")
        void generateTemplate_GivenCustomPromptAndGeminiUp_ReturnsAiGeneratedCode() {
            GenerateTemplateRequest request = buildRequest("TERRAFORM", "AWS");
            request.setCustomPrompt("Add DynamoDB table for session storage with PAY_PER_REQUEST billing");

            String aiCode = "# AI Generated Terraform with DynamoDB\nresource \"aws_dynamodb_table\" ...";
            when(geminiAiService.isConfigured()).thenReturn(true);
            when(geminiAiService.generateDevOpsResponse(anyString())).thenReturn(aiCode);
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            assertThat(response.getCodeContent()).isEqualTo(aiCode);
            verify(geminiAiService).generateDevOpsResponse(anyString());
        }

        @Test
        @DisplayName("generateTemplate: custom prompt but Gemini returns null → falls back to built-in")
        void generateTemplate_GivenCustomPromptAndGeminiReturnsNull_FallsBackToBuiltIn() {
            GenerateTemplateRequest request = buildRequest("TERRAFORM", "AWS");
            request.setCustomPrompt("some custom requirement");

            when(geminiAiService.isConfigured()).thenReturn(true);
            when(geminiAiService.generateDevOpsResponse(anyString())).thenReturn(null);
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            TemplateResponse response = templateGeneratorService.generateTemplate(1L, request);

            // Should still produce a valid Terraform template
            assertThat(response.getCodeContent()).contains("terraform");
        }
    }

    // =====================================================================
    // Persistence and retrieval
    // =====================================================================
    @Nested
    @DisplayName("Persistence and Retrieval")
    class PersistenceTests {

        @Test
        @DisplayName("generateTemplate: always saves to repository regardless of AI or built-in source")
        void generateTemplate_AlwaysPersistsToRepository() {
            GenerateTemplateRequest request = buildRequest("HELM", "K8S");
            when(templateRepository.save(any(GeneratedTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            templateGeneratorService.generateTemplate(42L, request);

            verify(templateRepository, times(1)).save(any(GeneratedTemplate.class));
        }

        @Test
        @DisplayName("getTemplateById: non-existent UUID → throws ResourceNotFoundException")
        void getTemplateById_GivenNonExistentId_ThrowsResourceNotFoundException() {
            UUID randomId = UUID.randomUUID();
            when(templateRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> templateGeneratorService.getTemplateById(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("GeneratedTemplate");
        }
    }

    // =====================================================================
    // Helpers
    // =====================================================================
    private GenerateTemplateRequest buildRequest(String templateType, String provider) {
        GenerateTemplateRequest req = new GenerateTemplateRequest();
        req.setTemplateType(templateType);
        req.setTargetProvider(provider);
        req.setServiceName("forgeops-app");
        req.setEnvironment("production");
        return req;
    }
}
