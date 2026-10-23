package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

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
class CambioProyectoTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	ColaboradorRepository repositorio;

	@Autowired
	JdbcClient jdbc;

	@Test
	void cambioEntreProyectosPropios() {
		var colaborador = guardar("ASSA_CORE");
		var json = assertThat(cambiar(colaborador, 0, "\"SUPERNOVA_APP\"", TestJwts.dm())).hasStatusOk().bodyJson();
		json.extractingPath("$.proyecto.codigo").isEqualTo("SUPERNOVA_APP");
		json.extractingPath("$.reportaA.username").isEqualTo("dm@cleteci.local");
	}

	@Test
	void dejarSinProyecto() {
		var colaborador = guardar("ASSA_CORE");
		assertThat(cambiar(colaborador, 0, "null", TestJwts.dm())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.proyecto")
			.isNull();
	}

	@Test
	void proyectoDeOtroDeliveryManager() {
		var colaborador = guardar("ASSA_CORE");
		assertThat(cambiar(colaborador, 0, "\"PORTAL_CLIENTES\"", TestJwts.dm())).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(repositorio.findById(colaborador.getId().valor()).orElseThrow().getProyectoCodigo())
			.isEqualTo("ASSA_CORE");
	}

	@Test
	void proyectoPropioInactivo() {
		var colaborador = guardar("ASSA_CORE");
		jdbc.sql("UPDATE proyecto SET activo = false WHERE codigo = 'SUPERNOVA_APP'").update();
		assertThat(cambiar(colaborador, 0, "\"SUPERNOVA_APP\"", TestJwts.dm())).hasStatus(HttpStatus.BAD_REQUEST);
	}

	@Test
	void colaboradorFueraDeSuEquipo() {
		assertThat(cambiar(guardar("PORTAL_CLIENTES"), 0, "\"ASSA_CORE\"", TestJwts.dm()))
			.hasStatus(HttpStatus.NOT_FOUND);
		assertThat(cambiar(guardar(null), 0, "\"ASSA_CORE\"", TestJwts.dm())).hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void versionDesactualizada() {
		var colaborador = guardar("ASSA_CORE");
		assertThat(cambiar(colaborador, 0, "\"SUPERNOVA_APP\"", TestJwts.dm())).hasStatusOk();
		assertThat(cambiar(colaborador, 0, "\"ASSA_CORE\"", TestJwts.dm())).hasStatus(HttpStatus.CONFLICT);
	}

	@Test
	void soloElDeliveryManager() {
		assertThat(cambiar(guardar("ASSA_CORE"), 0, "\"SUPERNOVA_APP\"", TestJwts.pyt()))
			.hasStatus(HttpStatus.FORBIDDEN);
	}

	private Colaborador guardar(String proyecto) {
		return repositorio.saveAndFlush(new Colaborador(ColaboradorFixtures.datos("Persona Equipo",
				"CP-" + System.nanoTime(), "ASSA_ACSEL", proyecto)));
	}

	private MvcTestResult cambiar(Colaborador colaborador, long version, String proyectoJson,
			JwtRequestPostProcessor usuario) {
		return mvc.patch()
			.uri("/api/v1/colaboradores/" + colaborador.getId() + "/proyecto")
			.with(usuario)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"version\": " + version + ", \"proyectoCodigo\": " + proyectoJson + "}")
			.exchange();
	}

}
