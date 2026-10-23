package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Transactional
class ConsultaColaboradoresTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	ColaboradorRepository repositorio;

	@Test
	void primeraPaginaPorDefecto() {
		IntStream.rangeClosed(1, 45)
			.forEach(i -> guardar("Persona " + i, "DOC-" + i, "ASSA_ACSEL", "ASSA_CORE"));
		var json = assertThat(mvc.get().uri("/api/v1/colaboradores").with(TestJwts.pyt())).hasStatusOk().bodyJson();
		json.extractingPath("$.items").asArray().hasSize(20);
		json.extractingPath("$.totalElements").isEqualTo(45);
		json.extractingPath("$.totalPages").isEqualTo(3);
		json.extractingPath("$.page").isEqualTo(0);
		var ids = json.extractingPath("$.items[*].id").asArray().actual();
		assertThat(ids).isSortedAccordingTo((a, b) -> ((String) a).compareTo((String) b));
	}

	@Test
	void tamanoMaximoDePagina() {
		assertThat(mvc.get().uri("/api/v1/colaboradores?size=101").with(TestJwts.pyt()))
			.hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(mvc.get().uri("/api/v1/colaboradores?sort=documento,asc").with(TestJwts.pyt()))
			.hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].field")
			.isEqualTo("sort");
	}

	@Test
	void ordenPorNombreDescendente() {
		guardar("Ana Uno", "O-1", "SUPERNOVA", null);
		guardar("Zoe Dos", "O-2", "SUPERNOVA", null);
		assertThat(mvc.get().uri("/api/v1/colaboradores?sort=nombreCorto,desc&unidad=SUPERNOVA").with(TestJwts.pyt()))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].nombreCorto")
			.asArray()
			.containsExactly("Zoe", "Ana");
	}

	@Test
	void busquedaPorNombreSinAcentosNiMayusculas() {
		guardar("Carlos Pérez Mora", "B-1", "ASSA_ACSEL", null);
		guardar("Lucía Perez", "B-2", "SUPERNOVA", null);
		guardar("Pedro Gómez", "B-3", "SUPERNOVA", null);
		assertThat(mvc.get().uri("/api/v1/colaboradores?q=pérez").with(TestJwts.pyt())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].nombreCompleto")
			.asArray()
			.containsExactlyInAnyOrder("Carlos Pérez Mora", "Lucía Perez");
	}

	@Test
	void busquedaPorDocumentoEId() {
		var colaborador = guardar("Elena Ruiz", "V-20.111.222", "SUPERNOVA", null);
		assertThat(mvc.get().uri("/api/v1/colaboradores?q=20111222").with(TestJwts.pyt())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].nombreCompleto")
			.asArray()
			.containsExactly("Elena Ruiz");
		assertThat(mvc.get().uri("/api/v1/colaboradores?q=" + colaborador.getId()).with(TestJwts.pyt())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].id")
			.asArray()
			.contains(colaborador.getId().toString());
	}

	@Test
	void filtroPorUnidadProyectoYEstado() {
		guardar("Uno Supernova", "F-1", "SUPERNOVA", "SUPERNOVA_APP");
		guardar("Dos Assa", "F-2", "ASSA_ACSEL", "ASSA_CORE");
		var json = assertThat(mvc.get().uri("/api/v1/colaboradores?unidad=SUPERNOVA").with(TestJwts.pyt()))
			.hasStatusOk()
			.bodyJson();
		json.extractingPath("$.items[*].unidadProduccion.nombre").asArray().containsOnly("Supernova");
		assertThat(mvc.get().uri("/api/v1/colaboradores?proyecto=ASSA_CORE&estado=EN_ONBOARDING").with(TestJwts.pyt()))
			.hasStatusOk()
			.bodyJson()
			.extractingPath("$.items[*].nombreCompleto")
			.asArray()
			.containsExactly("Dos Assa");
		assertThat(mvc.get().uri("/api/v1/colaboradores?estado=ACTIVO").with(TestJwts.pyt())).hasStatusOk()
			.bodyJson()
			.extractingPath("$.totalElements")
			.isEqualTo(0);
	}

	@Test
	void fichaExistente() {
		var colaborador = guardar("Ficha Completa", "FC-1", "SUPERNOVA", "SUPERNOVA_APP");
		var json = assertThat(mvc.get().uri("/api/v1/colaboradores/" + colaborador.getId()).with(TestJwts.pyt()))
			.hasStatusOk()
			.bodyJson();
		json.extractingPath("$.id").isEqualTo(colaborador.getId().toString());
		json.extractingPath("$.unidadProduccion.nombre").isEqualTo("Supernova");
		json.extractingPath("$.proyecto.nombre").isEqualTo("Supernova App");
		json.extractingPath("$.nivel.codigo").isEqualTo("N3");
		json.extractingPath("$.banda").isEqualTo("B");
		json.extractingPath("$.paisResidencia.nombre").isEqualTo("Venezuela");
		json.extractingPath("$.antiguedad.anios").isNotNull();
		json.extractingPath("$.elegibilidades.salaryReview.motivo").isEqualTo("En onboarding / período de prueba.");
	}

	@Test
	void fichaAccesibleSinCerosALaIzquierda() {
		var colaborador = guardar("Sin Ceros", "SC-1", "SUPERNOVA", null);
		assertThat(mvc.get().uri("/api/v1/colaboradores/" + colaborador.getId().valor()).with(TestJwts.pyt()))
			.hasStatusOk();
	}

	@Test
	void fichaInexistente() {
		assertThat(mvc.get().uri("/api/v1/colaboradores/99999").with(TestJwts.pyt())).hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("No existe el colaborador 99999.");
		assertThat(mvc.get().uri("/api/v1/colaboradores/abc").with(TestJwts.pyt())).hasStatus(HttpStatus.NOT_FOUND);
	}

	private Colaborador guardar(String nombre, String documento, String unidad, String proyecto) {
		return repositorio.save(new Colaborador(ColaboradorFixtures.datos(nombre, documento, unidad, proyecto)));
	}

}
