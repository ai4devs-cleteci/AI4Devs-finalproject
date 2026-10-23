package com.cleteci.erp.plataforma;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

/**
 * Error esperado de una operación de negocio. El detalle se resuelve en {@code messages.properties}
 * con {@link #codigoMensaje()} y {@link #argumentos()}; el manejador global lo convierte en un
 * Problem Details con el estado HTTP de la subclase.
 */
public abstract sealed class ErrorDeNegocioException extends RuntimeException
		permits RecursoNoEncontradoException, ConflictoException, OperacionNoPermitidaException {

	private final String codigoMensaje;

	private final Object[] argumentos;

	private final Map<String, Object> propiedades = new LinkedHashMap<>();

	private String campo;

	protected ErrorDeNegocioException(String codigoMensaje, Object... argumentos) {
		super(codigoMensaje);
		this.codigoMensaje = codigoMensaje;
		this.argumentos = argumentos;
	}

	abstract HttpStatus status();

	/** Identificador corto del tipo de problema (parte final de {@code type}). */
	abstract String tipo();

	public String codigoMensaje() {
		return codigoMensaje;
	}

	public Object[] argumentos() {
		return argumentos.clone();
	}

	/** Propiedad adicional que se añade al cuerpo de la respuesta. */
	public ErrorDeNegocioException conPropiedad(String nombre, Object valor) {
		propiedades.put(nombre, valor);
		return this;
	}

	/** Campo de la petición al que se atribuye el error (se añade a {@code errors}). */
	public ErrorDeNegocioException enCampo(String campo) {
		this.campo = campo;
		return this;
	}

	Map<String, Object> propiedades() {
		return propiedades;
	}

	String campo() {
		return campo;
	}

}
