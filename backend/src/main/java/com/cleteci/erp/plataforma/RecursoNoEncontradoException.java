package com.cleteci.erp.plataforma;

import org.springframework.http.HttpStatus;

/** El recurso solicitado no existe o no es visible para el usuario. */
public final class RecursoNoEncontradoException extends ErrorDeNegocioException {

	public RecursoNoEncontradoException(String codigoMensaje, Object... argumentos) {
		super(codigoMensaje, argumentos);
	}

	@Override
	HttpStatus status() {
		return HttpStatus.NOT_FOUND;
	}

	@Override
	String tipo() {
		return "no-encontrado";
	}

}
