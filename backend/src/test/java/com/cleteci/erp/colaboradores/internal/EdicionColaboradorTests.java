package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Transactional
class EdicionColaboradorTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	JdbcClient jdbc;

	String id;

	@BeforeEach
	void alta() {
		var resultado = mvc.post()
			.uri("/api/v1/colaboradores")
			.with(TestJwts.pyt())
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(ColaboradorFixtures.peticion()))
			.exchange();
		assertThat(resultado).hasStatus(HttpStatus.CREATED);
		id = assertThat(resultado).bodyJson().extractingPath("$.id").asString().actual();
	}

	@Test
	void edicionValida() {
		var peticion = edicion(0);
		peticion.put("rolCodigo", "ARQUITECTO");
		peticion.put("telefono", "+573001234567");
		var json = assertThat(editar(peticion)).hasStatusOk().bodyJson();
		json.extractingPath("$.id").isEqualTo(id);
		json.extractingPath("$.rol.codigo").isEqualTo("ARQUITECTO");
		json.extractingPath("$.telefono").isEqualTo("+573001234567");
		json.extractingPath("$.version").isEqualTo(1);
	}

	@Test
	void elEstadoNoCambiaEditando() {
		var peticion = edicion(0);
		peticion.put("estado", "ACTIVO");
		assertThat(editar(peticion)).hasStatusOk().bodyJson().extractingPath("$.estado").isEqualTo("EN_ONBOARDING");
	}

	@Test
	void cambiarElNivelActualizaLaBanda() {
		var peticion = edicion(0);
		peticion.put("nivelCodigo", "N5");
		assertThat(editar(peticion)).hasStatusOk().bodyJson().extractingPath("$.banda").isEqualTo("C");
	}

	@Test
	void validacionesDelAltaAplicanAlEditar() {
		var peticion = edicion(0);
		peticion.put("telefono", "123");
		assertThat(editar(peticion)).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].field")
			.isEqualTo("telefono");
	}

	@Test
	void laVersionEsObligatoria() {
		var peticion = edicion(0);
		peticion.remove("version");
		assertThat(editar(peticion)).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].field")
			.isEqualTo("version");
	}

	@Test
	void unCatalogoDesactivadoSinCambiarSeConserva() {
		jdbc.sql("UPDATE rol SET activo = false WHERE codigo = 'DESARROLLADOR'").update();
		var peticion = edicion(0);
		peticion.put("nombreCorto", "Majo Pérez");
		assertThat(editar(peticion)).hasStatusOk();
	}

	@Test
	void pytNoCambiaUnProyectoYaAsignado() {
		var peticion = edicion(0);
		peticion.put("proyectoCodigo", "SUPERNOVA_APP");
		peticion.put("nombreCorto", "No debe guardarse");
		assertThat(editar(peticion)).hasStatus(HttpStatus.FORBIDDEN)
			.bodyJson()
			.extractingPath("$.codigo")
			.isEqualTo("colaborador.proyecto-solo-dm");
		assertThat(ficha()).bodyJson().extractingPath("$.nombreCorto").isEqualTo("María Pérez");
	}

	@Test
	void pytAsignaProyectoSiNoTieneUno() {
		var sinProyecto = ColaboradorFixtures.peticion();
		sinProyecto.put("documento", "SP-1");
		sinProyecto.put("proyectoCodigo", null);
		var alta = mvc.post()
			.uri("/api/v1/colaboradores")
			.with(TestJwts.pyt())
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(sinProyecto))
			.exchange();
		id = assertThat(alta).bodyJson().extractingPath("$.id").asString().actual();
		var peticion = edicion(0);
		peticion.put("documento", "SP-1");
		peticion.put("proyectoCodigo", "SUPERNOVA_APP");
		assertThat(editar(peticion)).hasStatusOk()
			.bodyJson()
			.extractingPath("$.proyecto.codigo")
			.isEqualTo("SUPERNOVA_APP");
	}

	@Test
	void edicionPorDireccion() {
		assertThat(editar(edicion(0), TestJwts.direccion())).hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void dosEdicionesConLaMismaVersion() {
		var primera = edicion(0);
		primera.put("nombreCorto", "Primer cambio");
		assertThat(editar(primera)).hasStatusOk();
		var segunda = edicion(0);
		segunda.put("nombreCorto", "Otro cambio");
		assertThat(editar(segunda)).hasStatus(HttpStatus.CONFLICT)
			.bodyJson()
			.extractingPath("$.codigo")
			.isEqualTo("error.version-desactualizada");
	}

	@Test
	void documentoDeOtroColaborador() {
		var otro = ColaboradorFixtures.peticion();
		otro.put("documento", "E-555");
		mvc.post()
			.uri("/api/v1/colaboradores")
			.with(TestJwts.pyt())
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(otro))
			.exchange();
		var peticion = edicion(0);
		peticion.put("documento", "e555");
		assertThat(editar(peticion)).hasStatus(HttpStatus.CONFLICT);
	}

	@Test
	void editarUnInexistente() {
		assertThat(mvc.put()
			.uri("/api/v1/colaboradores/99999")
			.with(TestJwts.pyt())
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(edicion(0)))).hasStatus(HttpStatus.NOT_FOUND);
	}

	private static Map<String, @Nullable Object> edicion(long version) {
		var peticion = ColaboradorFixtures.peticion();
		peticion.put("version", version);
		return peticion;
	}

	private MvcTestResult editar(Map<String, @Nullable Object> peticion) {
		return editar(peticion, TestJwts.pyt());
	}

	private MvcTestResult editar(Map<String, @Nullable Object> peticion, JwtRequestPostProcessor usuario) {
		return mvc.put()
			.uri("/api/v1/colaboradores/" + id)
			.with(usuario)
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(peticion))
			.exchange();
	}

	private MvcTestResult ficha() {
		return mvc.get().uri("/api/v1/colaboradores/" + id).with(TestJwts.pyt()).exchange();
	}

}
