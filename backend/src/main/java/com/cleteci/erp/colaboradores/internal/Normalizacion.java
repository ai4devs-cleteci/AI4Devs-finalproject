package com.cleteci.erp.colaboradores.internal;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Formas normalizadas de los textos usadas para comparar y buscar. */
final class Normalizacion {

	private static final Pattern MARCAS_DIACRITICAS = Pattern.compile("\\p{M}+");

	private static final Pattern ESPACIOS = Pattern.compile("\\s+");

	private static final Pattern SEPARADORES_DOCUMENTO = Pattern.compile("[\\s.\\-]+");

	private Normalizacion() {
	}

	/** Minúsculas, sin acentos y con los espacios colapsados: {@code "  María  Pérez"} → {@code "maria perez"}. */
	static String texto(String valor) {
		var sinAcentos = MARCAS_DIACRITICAS.matcher(Normalizer.normalize(valor, Normalizer.Form.NFD)).replaceAll("");
		return ESPACIOS.matcher(sinAcentos.toLowerCase(Locale.ROOT).strip()).replaceAll(" ");
	}

	/** Mayúsculas sin espacios, puntos ni guiones: {@code "v-12.345.678"} → {@code "V12345678"}. */
	static String documento(String valor) {
		return SEPARADORES_DOCUMENTO.matcher(valor).replaceAll("").toUpperCase(Locale.ROOT);
	}

}
