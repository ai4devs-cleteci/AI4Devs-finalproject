package com.cleteci.erp.organizacion.internal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Transactional
class CatalogosControllerTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	JdbcClient jdbc;

	@Test
	void consultarUnidadesDeProduccion() {
		var json = assertThat(mvc.get().uri("/api/v1/catalogos/unidades-produccion").with(TestJwts.dm()))
			.hasStatusOk()
			.bodyJson();
		json.extractingPath("$.items[*].nombre").asArray().containsExactly("Assa Acsel", "Corporativo", "Supernova");
		json.extractingPath("$.items[0].codigo").isEqualTo("ASSA_ACSEL");
	}

	@Test
	void nivelesConBandaEnOrden() {
		var json = assertThat(mvc.get().uri("/api/v1/catalogos/niveles").with(TestJwts.pyt())).hasStatusOk()
			.bodyJson();
		json.extractingPath("$.items[*].codigo").asArray().containsExactly("N1", "N2", "N3", "N4", "N5", "N6");
		json.extractingPath("$.items[5].banda").isEqualTo("C");
	}

	@Test
	void proyectosConUnidadYDeliveryManager() {
		var json = assertThat(mvc.get().uri("/api/v1/catalogos/proyectos").with(TestJwts.pyt())).hasStatusOk()
			.bodyJson();
		json.extractingPath("$.items[?(@.codigo == 'ASSA_CORE')].deliveryManager.username")
			.asArray()
			.containsExactly("dm@cleteci.local");
		json.extractingPath("$.items[?(@.codigo == 'ASSA_CORE')].unidadCodigo")
			.asArray()
			.containsExactly("ASSA_ACSEL");
	}

	@Test
	void entradasInactivasExcluidas() {
		jdbc.sql("UPDATE pais SET activo = false WHERE codigo = 'UY'").update();
		assertThat(mvc.get().uri("/api/v1/catalogos/paises").with(TestJwts.pyt())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].codigo")
			.asArray()
			.doesNotContain("UY")
			.contains("VE");
	}

	@Test
	void catalogoInexistenteResponde404() {
		assertThat(mvc.get().uri("/api/v1/catalogos/monedas").with(TestJwts.pyt())).hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("No existe el catálogo «monedas».");
	}

	@Test
	void catalogosDeSoloLectura() {
		assertThat(mvc.post().uri("/api/v1/catalogos/proyectos").with(TestJwts.pyt()))
			.hasStatus(HttpStatus.METHOD_NOT_ALLOWED);
	}

	@Test
	void sinRolDelHrisResponde403() {
		assertThat(mvc.get().uri("/api/v1/catalogos/roles").with(TestJwts.usuario("x@cleteci.local", "offline_access")))
			.hasStatus(HttpStatus.FORBIDDEN);
	}

}
