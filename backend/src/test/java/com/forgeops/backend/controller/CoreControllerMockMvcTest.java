package com.forgeops.backend.controller;

import com.forgeops.backend.analyzer.controller.AnalyzerController;
import com.forgeops.backend.analyzer.dto.AnalysisResponse;
import com.forgeops.backend.analyzer.service.LogAnalyzerService;
import com.forgeops.backend.assistant.controller.AssistantController;
import com.forgeops.backend.assistant.dto.ChatSessionResponse;
import com.forgeops.backend.assistant.service.AssistantService;
import com.forgeops.backend.auth.controller.AuthController;
import com.forgeops.backend.auth.dto.AuthResponse;
import com.forgeops.backend.auth.service.AuthService;
import com.forgeops.backend.auth.service.CurrentUserService;
import com.forgeops.backend.generator.controller.GeneratorController;
import com.forgeops.backend.generator.dto.TemplateResponse;
import com.forgeops.backend.generator.service.TemplateGeneratorService;
import com.forgeops.backend.terminal.controller.TerminalController;
import com.forgeops.backend.terminal.dto.CommandExplanationResponse;
import com.forgeops.backend.terminal.service.ShellSafetyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

@ExtendWith(MockitoExtension.class)
class CoreControllerMockMvcTest {

    private static final String EMAIL = "engineer@forgeops.ai";

    @Mock private AuthService authService;
    @Mock private AssistantService assistantService;
    @Mock private LogAnalyzerService logAnalyzerService;
    @Mock private TemplateGeneratorService templateGeneratorService;
    @Mock private ShellSafetyService shellSafetyService;
    @Mock private CurrentUserService currentUserService;
    @Mock private TaskExecutor aiTaskExecutor;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = standaloneSetup(
                new AuthController(authService, true, 86400000L),
                new AssistantController(assistantService, aiTaskExecutor),
                new AnalyzerController(logAnalyzerService, currentUserService),
                new GeneratorController(templateGeneratorService, currentUserService),
                new TerminalController(shellSafetyService))
                .setCustomArgumentResolvers(new FixedPrincipalResolver())
                .build();
    }

    @Test
    void authControllerReturnsTokensForValidLogin() throws Exception {
        when(authService.authenticateUser(any())).thenReturn(
                new AuthService.AuthSession(new AuthResponse("access-token", EMAIL), "refresh-token"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"engineer@forgeops.ai","password":"strong-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.containsString("forgeops_refresh=refresh-token"),
                        org.hamcrest.Matchers.containsString("Path=/api/auth"),
                        org.hamcrest.Matchers.containsString("HttpOnly"),
                        org.hamcrest.Matchers.containsString("Secure"),
                        org.hamcrest.Matchers.containsString("SameSite=Strict"))));
    }

    @Test
    void assistantControllerReturnsBoundedSessionHistory() throws Exception {
        UUID id = UUID.randomUUID();
        when(assistantService.getUserSessions(eq(EMAIL), any(Pageable.class))).thenReturn(
                List.of(new ChatSessionResponse(id, "Incident review", LocalDateTime.now(), LocalDateTime.now())));

        mockMvc.perform(get("/api/assistant/sessions").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].title").value("Incident review"));
    }

    @Test
    void analyzerControllerDelegatesWithAuthenticatedUserId() throws Exception {
        when(currentUserService.requireId(EMAIL)).thenReturn(42L);
        when(logAnalyzerService.analyzeLog(anyLong(), any())).thenReturn(new AnalysisResponse());

        mockMvc.perform(post("/api/analyzer/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rawLog":"ERROR deployment failed","targetType":"JENKINS","title":"Build 42"}
                                """))
                .andExpect(status().isOk());

        verify(logAnalyzerService).analyzeLog(eq(42L), any());
    }

    @Test
    void generatorControllerDelegatesWithAuthenticatedUserId() throws Exception {
        when(currentUserService.requireId(EMAIL)).thenReturn(42L);
        when(templateGeneratorService.generateTemplate(anyLong(), any())).thenReturn(new TemplateResponse());

        mockMvc.perform(post("/api/generator/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"templateType":"KUBERNETES","serviceName":"payments"}
                                """))
                .andExpect(status().isOk());

        verify(templateGeneratorService).generateTemplate(eq(42L), any());
    }

    @Test
    void terminalControllerReturnsSafetyClassification() throws Exception {
        when(shellSafetyService.explainCommand("rm -rf /")).thenReturn(new CommandExplanationResponse(
                "rm -rf /", "DANGEROUS", "Deletes the root filesystem", List.of(),
                "Use a scoped path", "Do not execute this command."));

        mockMvc.perform(post("/api/terminal/explain")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"command\":\"rm -rf /\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.safetyLevel").value("DANGEROUS"))
                .andExpect(jsonPath("$.safeAlternative").value("Use a scoped path"));
    }

    private static final class FixedPrincipalResolver implements HandlerMethodArgumentResolver {
        private final UserDetails principal = User.withUsername(EMAIL)
                .password("not-used")
                .roles("USER")
                .build();

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
        }

        @Override
        public Object resolveArgument(MethodParameter parameter,
                                      ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest,
                                      WebDataBinderFactory binderFactory) {
            return principal;
        }
    }
}
