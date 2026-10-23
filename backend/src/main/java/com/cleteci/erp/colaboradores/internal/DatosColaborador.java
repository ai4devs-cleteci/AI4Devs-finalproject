package com.cleteci.erp.colaboradores.internal;

import java.time.LocalDate;

import org.jspecify.annotations.Nullable;

/** Campos de identidad y posición que P&T introduce al dar de alta o editar un colaborador. */
record DatosColaborador(String nombreCompleto, String nombreCorto, TipoDocumento tipoDocumento, String documento,
		String correoPersonal, String telefono, @Nullable LocalDate fechaNacimiento, @Nullable Genero genero,
		@Nullable String nacionalidad, LocalDate fechaIngreso, String rolCodigo, String nivelCodigo,
		@Nullable String trayectoriaCodigo, String unidadCodigo, Modalidad modalidad, @Nullable String proyectoCodigo,
		String paisResidenciaCodigo) {
}
