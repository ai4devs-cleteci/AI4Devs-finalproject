package com.cleteci.erp.colaboradores;

import java.util.Optional;
import java.util.regex.Pattern;

/** ID correlativo del colaborador; se representa con 5 dígitos con ceros a la izquierda (00001). */
public record ColaboradorId(long valor) {

	public static final long MAXIMO = 99_999;

	private static final Pattern FORMATO = Pattern.compile("\\d{1,5}");

	public ColaboradorId {
		if (valor < 1 || valor > MAXIMO) {
			throw new IllegalArgumentException("ID de colaborador fuera de rango: " + valor);
		}
	}

	/** Interpreta un ID de hasta 5 dígitos ({@code 42} o {@code 00042}); vacío si no es válido. */
	public static Optional<ColaboradorId> parse(String texto) {
		if (texto == null || !FORMATO.matcher(texto).matches()) {
			return Optional.empty();
		}
		var valor = Long.parseLong(texto);
		return valor < 1 ? Optional.empty() : Optional.of(new ColaboradorId(valor));
	}

	@Override
	public String toString() {
		return "%05d".formatted(valor);
	}

}
