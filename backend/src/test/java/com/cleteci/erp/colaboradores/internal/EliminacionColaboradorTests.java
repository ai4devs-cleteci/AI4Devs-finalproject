package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Transactional
class EliminacionColaboradorTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	ColaboradorRepository repositorio;

	@Test
	void eliminarUnAltaErronea() {
		var colaborador = guardar("EL-1");
		assertThat(mvc.delete().uri("/api/v1/colaboradores/" + colaborador.getId()).with(TestJwts.pyt()))
			.hasStatus(HttpStatus.NO_CONTENT);
		assertThat(mvc.get().uri("/api/v1/colaboradores/" + colaborador.getId()).with(TestJwts.pyt()))
			.hasStatus(HttpStatus.NOT_FOUND);
	}

	@Test
	void elIdEliminadoNoSeReutiliza() {
		var eliminado = guardar("EL-2");
		mvc.delete().uri("/api/v1/colaboradores/" + eliminado.getId()).with(TestJwts.pyt()).exchange();
		var nuevo = mvc.post()
			.uri("/api/v1/colaboradores")
			.with(TestJwts.pyt())
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(ColaboradorFixtures.peticion()))
			.exchange();
		var id = assertThat(nuevo).hasStatus(HttpStatus.CREATED).bodyJson().extractingPath("$.id").asString().actual();
		assertThat(Long.parseLong(id)).isGreaterThan(eliminado.getId().valor());
	}

	@Test
	void eliminacionPorAdministracion() {
		var colaborador = guardar("EL-3");
		assertThat(mvc.delete().uri("/api/v1/colaboradores/" + colaborador.getId()).with(TestJwts.admin()))
			.hasStatus(HttpStatus.FORBIDDEN);
		assertThat(repositorio.existsById(colaborador.getId().valor())).isTrue();
	}

	@Test
	void eliminarUnInexistente() {
		assertThat(mvc.delete().uri("/api/v1/colaboradores/99999").with(TestJwts.pyt()))
			.hasStatus(HttpStatus.NOT_FOUND);
	}

	private Colaborador guardar(String documento) {
		return repositorio.saveAndFlush(
				new Colaborador(ColaboradorFixtures.datos("Alta Errónea", documento, "SUPERNOVA", null)));
	}

}
