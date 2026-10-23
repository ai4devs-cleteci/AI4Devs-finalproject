package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.IntegrationTest;
import com.cleteci.erp.TestJwts;

@IntegrationTest
@Transactional
class AltaColaboradorTests {

	@Autowired
	MockMvcTester mvc;

	@Autowired
	JdbcClient jdbc;

	@Test
	void primerColaboradorRecibeElId00001() {
		// setval no es transaccional: deja la secuencia como en una instalación nueva.
		jdbc.sql("SELECT setval('colaborador_id_seq', 1, false)").query().singleValue();
		assertThat(alta(ColaboradorFixtures.peticion())).hasStatus(HttpStatus.CREATED)
			.bodyJson()
			.extractingPath("$.id")
			.isEqualTo("00001");
	}

	@Test
	void altaCompleta() {
		var resultado = alta(ColaboradorFixtures.peticion());
		assertThat(resultado).hasStatus(HttpStatus.CREATED);
		var id = assertThat(resultado).bodyJson().extractingPath("$.id").asString().matches("\\d{5}").actual();
		assertThat(resultado.getResponse().getHeader(HttpHeaders.LOCATION)).endsWith("/api/v1/colaboradores/" + id);
		var json = assertThat(resultado).bodyJson();
		json.extractingPath("$.estado").isEqualTo("EN_ONBOARDING");
		json.extractingPath("$.banda").isEqualTo("B");
		json.extractingPath("$.rol.nombre").isEqualTo("Desarrollador/a de software");
		json.extractingPath("$.reportaA.username").isEqualTo("dm@cleteci.local");
		json.extractingPath("$.elegibilidades.prestamo.elegible").isEqualTo(false);
		json.extractingPath("$.version").isEqualTo(0);
	}

	@Test
	void altasSucesivasRecibenIdsMayores() {
		var primero = idDe(alta(ColaboradorFixtures.peticion()));
		var segundo = idDe(alta(con("documento", "E-99.999.999")));
		assertThat(Integer.parseInt(segundo)).isGreaterThan(Integer.parseInt(primero));
	}

	@Test
	void idYEstadoEnviadosPorElClienteSeIgnoran() {
		var peticion = ColaboradorFixtures.peticion();
		peticion.put("id", "99999");
		peticion.put("estado", "ACTIVO");
		var json = assertThat(alta(peticion)).hasStatus(HttpStatus.CREATED).bodyJson();
		json.extractingPath("$.id").isNotEqualTo("99999");
		json.extractingPath("$.estado").isEqualTo("EN_ONBOARDING");
	}

	@Test
	void faltanCamposObligatoriosNoCreaNiConsumeId() {
		var anterior = idDe(alta(con("documento", "OTRO-1")));
		var peticion = ColaboradorFixtures.peticion();
		peticion.remove("documento");
		peticion.remove("fechaIngreso");
		var json = assertThat(alta(peticion)).hasStatus(HttpStatus.BAD_REQUEST).bodyJson();
		json.extractingPath("$.errors[*].field").asArray().containsExactlyInAnyOrder("documento", "fechaIngreso");
		var siguiente = idDe(alta(con("documento", "OTRO-2")));
		assertThat(Integer.parseInt(siguiente)).isEqualTo(Integer.parseInt(anterior) + 1);
	}

	@Test
	void altaSinCamposOpcionales() {
		var peticion = ColaboradorFixtures.peticion();
		for (var campo : new String[] { "fechaNacimiento", "genero", "nacionalidad", "trayectoriaCodigo",
				"proyectoCodigo" }) {
			peticion.put(campo, null);
		}
		var json = assertThat(alta(peticion)).hasStatus(HttpStatus.CREATED).bodyJson();
		json.extractingPath("$.proyecto").isNull();
		json.extractingPath("$.reportaA").isNull();
		json.extractingPath("$.trayectoria").isNull();
	}

	@Test
	void telefonoSinCodigoDePais() {
		assertThat(alta(con("telefono", "04121234567"))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[?(@.field == 'telefono')].message")
			.asArray()
			.singleElement()
			.asString()
			.contains("código de país", "+584121234567");
	}

	@Test
	void textosEnBlancoYCorreoNoValido() {
		var peticion = con("nombreCorto", "   ");
		peticion.put("correoPersonal", "no-es-correo");
		assertThat(alta(peticion)).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[*].field")
			.asArray()
			.containsExactlyInAnyOrder("nombreCorto", "correoPersonal");
	}

	@Test
	void nivelInexistente() {
		assertThat(alta(con("nivelCodigo", "N9"))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].field")
			.isEqualTo("nivelCodigo");
	}

	@Test
	void catalogoInactivo() {
		jdbc.sql("UPDATE rol SET activo = false WHERE codigo = 'QA'").update();
		assertThat(alta(con("rolCodigo", "QA"))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].field")
			.isEqualTo("rolCodigo");
	}

	@Test
	void valorDeListaDesconocido() {
		assertThat(alta(con("modalidad", "FREELANCE"))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].field")
			.isEqualTo("modalidad");
	}

	@Test
	void fechaDeNacimientoFutura() {
		assertThat(alta(con("fechaNacimiento", "2999-01-01"))).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.errors[0].message")
			.isEqualTo("La fecha de nacimiento no puede ser futura.");
	}

	@Test
	void documentoRepetidoAunqueCambieElFormato() {
		var existente = idDe(alta(con("documento", "V-12.345.678")));
		var json = assertThat(alta(con("documento", "v12345678"))).hasStatus(HttpStatus.CONFLICT).bodyJson();
		json.extractingPath("$.colaboradorExistente").isEqualTo(existente);
		json.extractingPath("$.detail").asString().contains(existente);
		json.extractingPath("$.errors[0].field").isEqualTo("documento");
	}

	@Test
	void mismoNumeroConOtroTipoDeDocumento() {
		alta(con("documento", "12345678"));
		var pasaporte = con("documento", "12345678");
		pasaporte.put("tipoDocumento", "PASAPORTE");
		assertThat(alta(pasaporte)).hasStatus(HttpStatus.CREATED);
	}

	@Test
	void altaPorOtrosRoles() {
		assertThat(alta(ColaboradorFixtures.peticion(), TestJwts.direccion())).hasStatus(HttpStatus.FORBIDDEN);
		assertThat(alta(ColaboradorFixtures.peticion(), TestJwts.dm())).hasStatus(HttpStatus.FORBIDDEN);
	}

	private static Map<String, @Nullable Object> con(String campo, @Nullable Object valor) {
		var peticion = ColaboradorFixtures.peticion();
		peticion.put(campo, valor);
		return peticion;
	}

	private MvcTestResult alta(Map<String, @Nullable Object> peticion) {
		return alta(peticion, TestJwts.pyt());
	}

	private MvcTestResult alta(Map<String, @Nullable Object> peticion, JwtRequestPostProcessor usuario) {
		return mvc.post()
			.uri("/api/v1/colaboradores")
			.with(usuario)
			.contentType(MediaType.APPLICATION_JSON)
			.content(ColaboradorFixtures.json(peticion))
			.exchange();
	}

	private static String idDe(MvcTestResult resultado) {
		assertThat(resultado).hasStatus(HttpStatus.CREATED);
		return assertThat(resultado).bodyJson().extractingPath("$.id").asString().actual();
	}

}
