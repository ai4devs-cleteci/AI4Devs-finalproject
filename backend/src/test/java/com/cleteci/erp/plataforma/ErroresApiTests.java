package com.cleteci.erp.plataforma;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Import(PlataformaTestController.class)
class ErroresApiTests {

	@Autowired
	MockMvcTester mvc;

	@Test
	void validacionDevuelveUnErrorPorCampo() {
		var respuesta = mvc.post()
			.uri("/api/prueba/validacion")
			.with(TestJwts.pyt())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"nombre": "  ", "correo": "no-es-correo"}
					""");
		assertThat(respuesta).hasStatus(HttpStatus.BAD_REQUEST).hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
		var json = assertThat(respuesta).bodyJson();
		json.extractingPath("$.title").isEqualTo("Petición no válida");
		json.extractingPath("$.errors[*].field").asArray().containsExactlyInAnyOrder("nombre", "correo");
		json.extractingPath("$.errors[?(@.field == 'nombre')].message")
			.asArray()
			.singleElement()
			.isEqualTo("no debe estar vacío");
	}

	@Test
	void recursoNoEncontradoResponde404() {
		assertThat(mvc.get().uri("/api/prueba/no-encontrado").with(TestJwts.pyt())).hasStatus(HttpStatus.NOT_FOUND)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("El recurso solicitado no existe.");
	}

	@Test
	void conflictoIncluyePropiedadesYCampo() {
		var json = assertThat(mvc.get().uri("/api/prueba/conflicto").with(TestJwts.pyt()))
			.hasStatus(HttpStatus.CONFLICT)
			.bodyJson();
		json.extractingPath("$.extra").isEqualTo("valor");
		json.extractingPath("$.errors[0].field").isEqualTo("documento");
	}

	@Test
	void errorInesperadoNoExponeDetallesInternos() {
		var respuesta = mvc.get().uri("/api/prueba/error").with(TestJwts.pyt());
		assertThat(respuesta).hasStatus(HttpStatus.INTERNAL_SERVER_ERROR)
			.hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyText()
			.doesNotContain("detalle interno")
			.doesNotContain("IllegalStateException")
			.contains("Se produjo un error inesperado");
	}

	@Test
	void metodoNoPermitidoEnEspanol() {
		assertThat(mvc.delete().uri("/api/prueba/autenticado").with(TestJwts.pyt()))
			.hasStatus(HttpStatus.METHOD_NOT_ALLOWED)
			.bodyJson()
			.extractingPath("$.title")
			.isEqualTo("Método no permitido");
	}

}
