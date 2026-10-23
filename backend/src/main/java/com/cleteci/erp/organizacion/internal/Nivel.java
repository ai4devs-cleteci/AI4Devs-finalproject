package com.cleteci.erp.organizacion.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.cleteci.erp.organizacion.NivelInfo;

@Entity
@Immutable
@Table(name = "nivel")
class Nivel extends EntradaCatalogoEntity {

	@Column(nullable = false)
	private short orden;

	@Column(nullable = false, length = 1)
	@JdbcTypeCode(SqlTypes.CHAR)
	private String banda;

	protected Nivel() {
	}

	short getOrden() {
		return orden;
	}

	NivelInfo toInfo() {
		return new NivelInfo(getCodigo(), getNombre(), orden, banda, isActivo());
	}

}
