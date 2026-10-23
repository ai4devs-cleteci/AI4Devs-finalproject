package com.cleteci.erp.organizacion.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.hibernate.annotations.Immutable;

import com.cleteci.erp.organizacion.DeliveryManager;
import com.cleteci.erp.organizacion.ProyectoInfo;

@Entity
@Immutable
@Table(name = "proyecto")
class Proyecto extends EntradaCatalogoEntity {

	@Column(name = "unidad_codigo", nullable = false)
	private String unidadCodigo;

	@Column(name = "dm_username")
	private String dmUsername;

	@Column(name = "dm_nombre")
	private String dmNombre;

	protected Proyecto() {
	}

	ProyectoInfo toInfo() {
		var dm = dmUsername == null ? null : new DeliveryManager(dmUsername, dmNombre);
		return new ProyectoInfo(getCodigo(), getNombre(), unidadCodigo, dm, isActivo());
	}

}
