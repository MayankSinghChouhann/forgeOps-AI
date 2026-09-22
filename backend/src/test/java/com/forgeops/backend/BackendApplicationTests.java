package com.forgeops.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
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
	void prometheusMetricsAcceptDedicatedMonitoringCredentials() throws Exception {
		mockMvc.perform(get("/actuator/prometheus")
					.with(httpBasic("forgeops-monitor", "metrics-secret")))
				.andExpect(status().isOk())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("jvm_memory_used_bytes")));
	}

}
