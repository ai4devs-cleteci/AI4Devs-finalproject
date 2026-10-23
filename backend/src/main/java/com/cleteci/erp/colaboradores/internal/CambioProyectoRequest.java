package com.cleteci.erp.colaboradores.internal;

import jakarta.validation.constraints.NotNull;

import org.jspecify.annotations.Nullable;

/** Cambio de proyecto por el Delivery Manager; {@code proyectoCodigo} nulo deja al colaborador sin proyecto. */
record CambioProyectoRequest(@NotNull Long version, @Nullable String proyectoCodigo) {
}
