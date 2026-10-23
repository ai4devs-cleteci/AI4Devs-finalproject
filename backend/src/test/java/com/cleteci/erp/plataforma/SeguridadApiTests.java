package com.cleteci.erp.plataforma;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Import(PlataformaTestController.class)
class SeguridadApiTests {

	@Autowired
	MockMvcTester mvc;

	@Test
	void sinTokenResponde401ConProblemDetails() {
		var resultado = mvc.get().uri("/api/prueba/autenticado").exchange();
		assertThat(resultado).hasStatus(HttpStatus.UNAUTHORIZED)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson()
			.extractingPath("$.title")
			.isEqualTo("No autenticado");
		assertThat(resultado.getResponse().getHeader(HttpHeaders.WWW_AUTHENTICATE)).startsWith("Bearer");
	}

	@Test
	void conRolDelHrisRespondeOk() {
		assertThat(mvc.get().uri("/api/prueba/pyt").with(TestJwts.pyt())).hasStatusOk();
	}

	@Test
	void rolSinPermisoResponde403() {
		assertThat(mvc.get().uri("/api/prueba/pyt").with(TestJwts.colaborador())).hasStatus(HttpStatus.FORBIDDEN)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson()
			.extractingPath("$.status")
			.isEqualTo(403);
	}

	@Test
	void soloRolesPorDefectoDeKeycloakNoDanPermisos() {
		var token = TestJwts.usuario("otro@cleteci.local", "offline_access", "uma_authorization");
		assertThat(mvc.get().uri("/api/prueba/autenticado").with(token)).hasStatusOk();
		assertThat(mvc.get().uri("/api/prueba/pyt").with(token)).hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void preflightDesdeElFrontendLocalPermitido() {
		var resultado = mvc.options()
			.uri("/api/v1/colaboradores")
			.header(HttpHeaders.ORIGIN, "http://localhost:4200")
			.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PATCH")
			.header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization")
			.exchange();
		assertThat(resultado).hasStatusOk()
			.hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200");
		var respuesta = resultado.getResponse();
		assertThat(respuesta.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS)).contains("GET", "POST", "PUT",
				"PATCH", "DELETE");
		assertThat(respuesta.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS)).containsIgnoringCase("authorization");
	}

	@Test
	void origenNoPermitidoNoRecibeCabecerasCors() {
		assertThat(mvc.get()
			.uri("/api/prueba/autenticado")
			.header(HttpHeaders.ORIGIN, "http://evil.example")
			.with(TestJwts.pyt())).doesNotContainHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
	}

	@Test
	void healthEsPublico() {
		assertThat(mvc.get().uri("/actuator/health")).hasStatusOk();
	}

	@Test
	void otrosEndpointsDeActuatorRequierenToken() {
		assertThat(mvc.get().uri("/actuator/modulith")).hasStatus(HttpStatus.UNAUTHORIZED);
	}

}
