package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.cleteci.erp.IntegrationTest;

@IntegrationTest
class OpenApiTests {

	@Autowired
	MockMvcTester mvc;

	@Test
	void documentaLosEndpointsConSusRespuestas() {
		var json = assertThat(mvc.get().uri("/v3/api-docs")).hasStatusOk().bodyJson();
		json.extractingPath("$.paths['/api/v1/colaboradores'].post.responses").asMap().containsKeys("201", "400", "409");
		json.extractingPath("$.paths['/api/v1/colaboradores/{id}'].put.responses").asMap().containsKeys("200", "409");
		json.extractingPath("$.paths['/api/v1/colaboradores/{id}/proyecto'].patch.summary")
			.isEqualTo("Cambio de proyecto por el Delivery Manager");
		json.extractingPath("$.paths['/api/v1/colaboradores/{id}'].delete.responses").asMap().containsKey("204");
		json.extractingPath("$.paths['/api/v1/catalogos/{catalogo}'].get.responses").asMap().containsKey("404");
	}

}
