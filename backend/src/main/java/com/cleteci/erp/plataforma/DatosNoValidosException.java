package com.cleteci.erp.plataforma;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Errores de validación detectados por la lógica de negocio (p. ej., un código de catálogo
 * inexistente). Se responde igual que un error de Bean Validation: 400 con un error por campo.
 */
public final class DatosNoValidosException extends RuntimeException {

	private final Map<String, String> codigosPorCampo;

	/** @param codigosPorCampo campo de la petición → código del mensaje en {@code messages.properties} */
	public DatosNoValidosException(Map<String, String> codigosPorCampo) {
		super("Datos no válidos: " + codigosPorCampo.keySet());
		this.codigosPorCampo = new LinkedHashMap<>(codigosPorCampo);
	}

	Map<String, String> codigosPorCampo() {
		return codigosPorCampo;
	}

}
