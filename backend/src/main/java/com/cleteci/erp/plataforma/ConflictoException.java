package com.cleteci.erp.plataforma;

import org.springframework.http.HttpStatus;

/** La operación entra en conflicto con el estado actual del recurso. */
public final class ConflictoException extends ErrorDeNegocioException {

	/** Edición sobre una versión del registro que ya no es la vigente. */
	public static ConflictoException versionDesactualizada() {
		return new ConflictoException("error.version-desactualizada");
	}

	public ConflictoException(String codigoMensaje, Object... argumentos) {
		super(codigoMensaje, argumentos);
	}

	@Override
	HttpStatus status() {
		return HttpStatus.CONFLICT;
	}

	@Override
	String tipo() {
		return "conflicto";
	}

}
