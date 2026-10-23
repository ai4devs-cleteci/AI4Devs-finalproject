package com.cleteci.erp.organizacion;

/** Entrada de cualquier catálogo: código estable, nombre en español y si está activa. */
public record EntradaCatalogo(String codigo, String nombre, boolean activo) {
}
