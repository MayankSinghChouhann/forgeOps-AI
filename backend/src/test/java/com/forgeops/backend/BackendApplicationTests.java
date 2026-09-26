package com.forgeops.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.context.annotation.Import;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.concurrent.Callable;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(BackendApplicationTests.AsyncProbeController.class)
@TestPropertySource(properties = {
		"forgeops.metrics.password=metrics-secret",
		"management.endpoints.web.exposure.include=health,info,prometheus"
})
class BackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {
	}

	@Test
	void openApiDocumentIsPubliclyAvailable() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.info.title").value("ForgeOps AI API"));
	}

	@Test
	void prometheusMetricsRejectAnonymousRequests() throws Exception {
		mockMvc.perform(get("/actuator/prometheus"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void kubernetesHealthProbesArePublic() throws Exception {
		for (String group : new String[] {"liveness", "readiness"}) {
			mockMvc.perform(get("/actuator/health/" + group))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.status").value("UP"));
		}
	}

	@Test
	void prometheusMetricsAcceptDedicatedMonitoringCredentials() throws Exception {
		mockMvc.perform(get("/actuator/prometheus")
					.with(httpBasic("forgeops-monitor", "metrics-secret")))
				.andExpect(status().isOk())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("jvm_memory_used_bytes")));
	}

	@Test
	void authenticatedAsyncContinuationIsNotReauthorized() throws Exception {
		var result = mockMvc.perform(get("/api/test/async-probe")
				.with(SecurityMockMvcRequestPostProcessors.user("engineer@forgeops.ai").roles("USER")))
				.andExpect(request().asyncStarted())
				.andReturn();

		mockMvc.perform(asyncDispatch(result))
				.andExpect(status().isOk())
				.andExpect(content().string("stream-complete"));
	}

	@Test
	void evaluationMetricsRequireExplicitPermission() throws Exception {
		mockMvc.perform(get("/api/evaluation/metrics")
				.with(SecurityMockMvcRequestPostProcessors.user("operator@forgeops.ai").roles("OPERATOR")))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/evaluation/metrics")
				.with(SecurityMockMvcRequestPostProcessors.user("approver@forgeops.ai")
						.authorities(new SimpleGrantedAuthority("EVALUATION_READ"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalRecommendations").isNumber());
	}

	@Test
	void auditTrailRejectsUsersWithoutAuditPermission() throws Exception {
		mockMvc.perform(get("/api/audit")
				.with(SecurityMockMvcRequestPostProcessors.user("operator@forgeops.ai").roles("OPERATOR")))
				.andExpect(status().isForbidden());
	}

	@Controller
	static class AsyncProbeController {
		@GetMapping("/api/test/async-probe")
		@ResponseBody
		Callable<ResponseEntity<String>> asyncProbe() {
			return () -> ResponseEntity.ok("stream-complete");
		}
	}

}
