package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Transactional
class VisibilidadColaboradoresTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	ColaboradorRepository repositorio;

	Colaborador deSuEquipo;

	Colaborador deOtroDm;

	Colaborador sinProyecto;

	@BeforeEach
	void datos() {
		deSuEquipo = guardar("Equipo Propio", "V-1", "ASSA_CORE");
		deOtroDm = guardar("Equipo Ajeno", "V-2", "PORTAL_CLIENTES");
		sinProyecto = guardar("Sin Proyecto", "V-3", null);
	}

	@Test
	void deliveryManagerVeSoloASuEquipo() {
		assertThat(mvc.get().uri("/api/v1/colaboradores").with(TestJwts.dm())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].nombreCompleto")
			.asArray()
			.contains("Equipo Propio")
			.doesNotContain("Equipo Ajeno", "Sin Proyecto");
		assertThat(mvc.get().uri("/api/v1/colaboradores/" + deSuEquipo.getId()).with(TestJwts.dm())).hasStatusOk();
	}

	@Test
	void deliveryManagerNoVeFichasAjenas() {
		assertThat(mvc.get().uri("/api/v1/colaboradores/" + deOtroDm.getId()).with(TestJwts.dm()))
			.hasStatus(HttpStatus.NOT_FOUND);
		assertThat(mvc.get().uri("/api/v1/colaboradores/" + sinProyecto.getId()).with(TestJwts.dm()))
			.hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void deliveryManagerSinProyectosNoVeANadie() {
		var otroDm = TestJwts.usuario("nuevo.dm@cleteci.local", "delivery-manager");
		assertThat(mvc.get().uri("/api/v1/colaboradores").with(otroDm)).hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.isEqualTo(0);
	}

	@Test
	void direccionYAdministracionVenATodos() {
		for (var usuario : new org.springframework.test.web.servlet.request.RequestPostProcessor[] {
				TestJwts.direccion(), TestJwts.admin(), TestJwts.pyt() }) {
			assertThat(mvc.get().uri("/api/v1/colaboradores?size=100").with(usuario)).hasStatusOk()
				.bodyJson()
				.extractingPath("$.items[*].nombreCompleto")
				.asArray()
				.contains("Equipo Propio", "Equipo Ajeno", "Sin Proyecto");
			assertThat(mvc.get().uri("/api/v1/colaboradores/" + sinProyecto.getId()).with(usuario)).hasStatusOk();
		}
	}

	@Test
	void colaboradorNoAccede() {
		assertThat(mvc.get().uri("/api/v1/colaboradores").with(TestJwts.colaborador()))
			.hasStatus(HttpStatus.FORBIDDEN);
		assertThat(mvc.get().uri("/api/v1/colaboradores/" + deSuEquipo.getId()).with(TestJwts.colaborador()))
			.hasStatus(HttpStatus.FORBIDDEN);
	}

	private Colaborador guardar(String nombre, String documento, String proyecto) {
		return repositorio.save(new Colaborador(ColaboradorFixtures.datos(nombre, documento, "SUPERNOVA", proyecto)));
	}

}
