package com.cleteci.erp.colaboradores.internal;

import org.jspecify.annotations.Nullable;

/** Criterios del listado; los nulos no filtran. */
record BusquedaColaboradores(@Nullable String texto, @Nullable String unidadCodigo, @Nullable String proyectoCodigo,
		@Nullable EstadoColaborador estado) {
}
