package com.cleteci.erp.organizacion;

import org.jspecify.annotations.Nullable;

/** Proyecto con su unidad de producción y, si lo tiene, su Delivery Manager. */
public record ProyectoInfo(String codigo, String nombre, String unidadCodigo, @Nullable DeliveryManager deliveryManager,
		boolean activo) {
}
