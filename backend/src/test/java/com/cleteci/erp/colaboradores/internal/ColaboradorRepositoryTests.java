package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;

@IntegrationTest
@Transactional
class ColaboradorRepositoryTests {

	@Autowired
	ColaboradorRepository repositorio;

	@Test
	void asignaIdsCrecientes() {
		var primero = repositorio.save(new Colaborador(ColaboradorFixtures.datos("Ana Gómez", "100", "SUPERNOVA", null)));
		var segundo = repositorio.save(new Colaborador(ColaboradorFixtures.datos("Luis Díaz", "200", "SUPERNOVA", null)));
		assertThat(segundo.getId().valor()).isGreaterThan(primero.getId().valor());
		assertThat(segundo.getId().toString()).hasSize(5);
	}

	@Test
	void elDocumentoNormalizadoEsUnico() {
		repositorio.saveAndFlush(new Colaborador(ColaboradorFixtures.datos("Ana Gómez", "V-1.234", "SUPERNOVA", null)));
		assertThatThrownBy(() -> repositorio
			.saveAndFlush(new Colaborador(ColaboradorFixtures.datos("Ana Copia", "v 1234", "SUPERNOVA", null))))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

}
