package com.cleteci.erp.organizacion.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.organizacion.Catalogos;
import com.cleteci.erp.organizacion.EntradaCatalogo;
import com.cleteci.erp.organizacion.ProyectoInfo;
import com.cleteci.erp.organizacion.TipoCatalogo;

@IntegrationTest
@Transactional
class CatalogosTests {

	@Autowired
	Catalogos catalogos;

	@Autowired
	JdbcClient jdbc;

	@BeforeEach
	void unidadInactiva() {
		jdbc.sql("INSERT INTO unidad_produccion (codigo, nombre, activo) VALUES ('ANTIGUA', 'Unidad antigua', false)")
			.update();
	}

	@Test
	void flywayCargaLosCatalogosIniciales() {
		assertThat(catalogos.activos(TipoCatalogo.UNIDADES_PRODUCCION)).extracting(EntradaCatalogo::nombre)
			.containsExactly("Assa Acsel", "Corporativo", "Supernova");
		assertThat(catalogos.activos(TipoCatalogo.NIVELES)).extracting(EntradaCatalogo::codigo)
			.containsExactly("N1", "N2", "N3", "N4", "N5", "N6");
		assertThat(catalogos.activos(TipoCatalogo.TRAYECTORIAS)).hasSize(4);
		for (var tipo : TipoCatalogo.values()) {
			assertThat(catalogos.activos(tipo)).as(tipo.name()).isNotEmpty();
		}
	}

	@Test
	void cadaNivelTieneSuBanda() {
		assertThat(List.of("N1", "N3", "N6")).map(codigo -> catalogos.nivel(codigo).orElseThrow().banda())
			.containsExactly("A", "B", "C");
	}

	@Test
	void proyectosDelDeliveryManager() {
		assertThat(catalogos.proyectosDe("dm@cleteci.local")).extracting(ProyectoInfo::codigo)
			.containsExactlyInAnyOrder("ASSA_CORE", "SUPERNOVA_APP");
		assertThat(catalogos.proyecto("INTERNO").orElseThrow().deliveryManager()).isNull();
	}

	@Test
	void entradaInactivaNoCuentaComoActivaPeroResuelveSuNombre() {
		assertThat(catalogos.existeActivo(TipoCatalogo.UNIDADES_PRODUCCION, "ANTIGUA")).isFalse();
		assertThat(catalogos.existeActivo(TipoCatalogo.UNIDADES_PRODUCCION, "SUPERNOVA")).isTrue();
		assertThat(catalogos.activos(TipoCatalogo.UNIDADES_PRODUCCION)).extracting(EntradaCatalogo::codigo)
			.doesNotContain("ANTIGUA");
		assertThat(catalogos.nombres(TipoCatalogo.UNIDADES_PRODUCCION, List.of("ANTIGUA", "NO_EXISTE")))
			.containsExactlyEntriesOf(java.util.Map.of("ANTIGUA", "Unidad antigua"));
	}

}
