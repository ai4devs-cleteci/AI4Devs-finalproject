package com.cleteci.erp.plataforma;

import org.springframework.http.HttpStatus;

/** El usuario no puede realizar esta operación sobre el recurso. */
public final class OperacionNoPermitidaException extends ErrorDeNegocioException {

	public OperacionNoPermitidaException(String codigoMensaje, Object... argumentos) {
		super(codigoMensaje, argumentos);
	}

	@Override
	HttpStatus status() {
		return HttpStatus.FORBIDDEN;
	}

	@Override
	String tipo() {
		return "operacion-no-permitida";
	}

}
