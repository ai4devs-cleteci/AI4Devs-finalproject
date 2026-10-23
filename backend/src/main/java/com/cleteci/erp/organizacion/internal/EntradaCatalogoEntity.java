package com.cleteci.erp.organizacion.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

import com.cleteci.erp.organizacion.EntradaCatalogo;

/** Columnas comunes a todas las tablas de catálogo. Las entidades son de solo lectura. */
@MappedSuperclass
abstract class EntradaCatalogoEntity {

	@Id
	private String codigo;

	@Column(nullable = false)
	private String nombre;

	@Column(nullable = false)
	private boolean activo;

	protected EntradaCatalogoEntity() {
	}

	String getCodigo() {
		return codigo;
	}

	String getNombre() {
		return nombre;
	}

	boolean isActivo() {
		return activo;
	}

	EntradaCatalogo toEntrada() {
		return new EntradaCatalogo(codigo, nombre, activo);
	}

}
