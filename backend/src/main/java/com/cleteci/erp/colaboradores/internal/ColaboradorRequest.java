package com.cleteci.erp.colaboradores.internal;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.jspecify.annotations.Nullable;

/**
 * Cuerpo del alta ({@code POST}) y de la edición ({@code PUT}). El ID, el estado y los campos
 * derivados no forman parte de la petición: si llegan, se ignoran.
 */
record ColaboradorRequest(
		/** Versión leída; obligatoria solo al editar. */
		@NotNull(groups = Edicion.class) @Nullable Long version,
		@NotBlank @Size(max = 200) String nombreCompleto,
		@NotBlank @Size(max = 100) String nombreCorto,
		@NotNull TipoDocumento tipoDocumento,
		@NotBlank @Size(max = 40) String documento,
		@NotBlank @Email @Size(max = 254) String correoPersonal,
		@NotBlank @Pattern(regexp = "\\+[1-9]\\d{6,14}", message = "{colaborador.telefono.formato}") String telefono,
		@PastOrPresent(message = "{colaborador.fechaNacimiento.futura}") @Nullable LocalDate fechaNacimiento,
		@Nullable Genero genero,
		@Size(max = 80) @Nullable String nacionalidad,
		@NotNull LocalDate fechaIngreso,
		@NotBlank String rolCodigo,
		@NotBlank String nivelCodigo,
		@Nullable String trayectoriaCodigo,
		@NotBlank String unidadCodigo,
		@NotNull Modalidad modalidad,
		@Nullable String proyectoCodigo,
		@NotBlank String paisResidenciaCodigo) {

	/** Grupo de validación de la edición. */
	interface Edicion {
	}

	DatosColaborador toDatos() {
		return new DatosColaborador(nombreCompleto, nombreCorto, tipoDocumento, documento, correoPersonal, telefono,
				fechaNacimiento, genero, nacionalidad, fechaIngreso, rolCodigo, nivelCodigo, vacioANull(trayectoriaCodigo),
				unidadCodigo, modalidad, vacioANull(proyectoCodigo), paisResidenciaCodigo);
	}

	private static @Nullable String vacioANull(@Nullable String codigo) {
		return codigo == null || codigo.isBlank() ? null : codigo;
	}

}
