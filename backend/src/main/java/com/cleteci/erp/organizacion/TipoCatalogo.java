package com.cleteci.erp.organizacion;

import java.util.Arrays;
import java.util.Optional;

/** Catálogos disponibles, con el segmento de ruta con que se publican en la API. */
public enum TipoCatalogo {

	UNIDADES_PRODUCCION("unidades-produccion"), PROYECTOS("proyectos"), ROLES("roles"), NIVELES("niveles"),
	TRAYECTORIAS("trayectorias"), PAISES("paises");

	private final String ruta;

	TipoCatalogo(String ruta) {
		this.ruta = ruta;
	}

	public String ruta() {
		return ruta;
	}

	public static Optional<TipoCatalogo> deRuta(String ruta) {
		return Arrays.stream(values()).filter(tipo -> tipo.ruta.equals(ruta)).findFirst();
	}

}
