package com.cleteci.erp;

import org.junit.jupiter.api.Test;

import org.springframework.modulith.core.ApplicationModules;

/** Verifica que los módulos solo usan la API pública de los demás y que no hay ciclos. */
class ModularityTests {

	@Test
	void verificarModulos() {
		ApplicationModules.of(CleteciErpApplication.class).verify();
	}

}
