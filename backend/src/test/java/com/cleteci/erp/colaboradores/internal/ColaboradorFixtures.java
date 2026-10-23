package com.cleteci.erp.colaboradores.internal;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import org.jspecify.annotations.Nullable;
import tools.jackson.databind.json.JsonMapper;

/** Datos de prueba válidos para el registro del colaborador. */
final class ColaboradorFixtures {

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private ColaboradorFixtures() {
	}

	/** Cuerpo de alta válido como mapa, para modificar campos concretos en cada test. */
	static Map<String, @Nullable Object> peticion() {
		var peticion = new LinkedHashMap<String, @Nullable Object>();
		peticion.put("nombreCompleto", "María José Pérez Rodríguez");
		peticion.put("nombreCorto", "María Pérez");
		peticion.put("tipoDocumento", "CEDULA");
		peticion.put("documento", "V-12.345.678");
		peticion.put("correoPersonal", "maria.perez@example.com");
		peticion.put("telefono", "+584121234567");
		peticion.put("fechaNacimiento", "1990-05-20");
		peticion.put("genero", "FEMENINO");
		peticion.put("nacionalidad", "Venezolana");
		peticion.put("fechaIngreso", "2025-04-15");
		peticion.put("rolCodigo", "DESARROLLADOR");
		peticion.put("nivelCodigo", "N3");
		peticion.put("trayectoriaCodigo", "TECNICA");
		peticion.put("unidadCodigo", "ASSA_ACSEL");
		peticion.put("modalidad", "NOMINA");
		peticion.put("proyectoCodigo", "ASSA_CORE");
		peticion.put("paisResidenciaCodigo", "VE");
		return peticion;
	}

	static String json(Map<String, @Nullable Object> peticion) {
		return JSON.writeValueAsString(peticion);
	}

	static DatosColaborador datos(String nombreCompleto, String documento, String unidadCodigo,
			@Nullable String proyectoCodigo) {
		return new DatosColaborador(nombreCompleto, nombreCompleto.split(" ")[0], TipoDocumento.CEDULA, documento,
				"correo@example.com", "+584121234567", null, null, null, LocalDate.of(2025, 4, 15), "DESARROLLADOR",
				"N3", null, unidadCodigo, Modalidad.NOMINA, proyectoCodigo, "VE");
	}

}
