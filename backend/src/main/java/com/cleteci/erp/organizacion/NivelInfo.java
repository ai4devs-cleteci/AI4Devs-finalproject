package com.cleteci.erp.organizacion;

/** Nivel de job architecture con la banda (A, B o C) que determina. */
public record NivelInfo(String codigo, String nombre, int orden, String banda, boolean activo) {
}
