package com.cleteci.erp.organizacion;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** API pública del módulo para consultar los catálogos desde otros módulos. */
public interface Catalogos {

	/** Entradas activas de un catálogo, en el orden en que se presentan al usuario. */
	List<EntradaCatalogo> activos(TipoCatalogo tipo);

	boolean existeActivo(TipoCatalogo tipo, String codigo);

	Optional<NivelInfo> nivel(String codigo);

	Optional<ProyectoInfo> proyecto(String codigo);

	/** Proyectos (activos o no) de los que el usuario es Delivery Manager. */
	List<ProyectoInfo> proyectosDe(String dmUsername);

	/** Nombre de cada código existente, activo o no; los códigos desconocidos no aparecen. */
	Map<String, String> nombres(TipoCatalogo tipo, Collection<String> codigos);

}
