package com.cleteci.erp.colaboradores.internal;

import java.time.LocalDate;

import org.jspecify.annotations.Nullable;

/** Representaciones del colaborador en la API. */
final class ColaboradorResponses {

	private ColaboradorResponses() {
	}

	/** Valor de catálogo con su código y su nombre legible. */
	record Referencia(String codigo, String nombre) {
	}

	record Persona(String username, String nombre) {
	}

	record Antiguedad(int anios, int meses) {
	}

	record Elegibilidad(boolean elegible, @Nullable String motivo) {
	}

	record Elegibilidades(Elegibilidad salaryReview, Elegibilidad prestamo, Elegibilidad descansoRemunerado) {
	}

	/** Ficha completa: identidad, posición y contrato, derivados y calculados. */
	record Detalle(String id, long version, String nombreCompleto, String nombreCorto, TipoDocumento tipoDocumento,
			String documento, String correoPersonal, String telefono, @Nullable LocalDate fechaNacimiento,
			@Nullable Genero genero, @Nullable String nacionalidad, LocalDate fechaIngreso, Referencia rol,
			Referencia nivel, @Nullable String banda, @Nullable Referencia trayectoria, Referencia unidadProduccion,
			Modalidad modalidad, EstadoColaborador estado, @Nullable Referencia proyecto, @Nullable Persona reportaA,
			Referencia paisResidencia, Antiguedad antiguedad, Elegibilidades elegibilidades) {
	}

	/** Fila del listado. */
	record Resumen(String id, String nombreCorto, String nombreCompleto, Referencia rol, Referencia unidadProduccion,
			@Nullable Referencia proyecto, EstadoColaborador estado, LocalDate fechaIngreso) {
	}

}
