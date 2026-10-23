package com.cleteci.erp.organizacion.internal;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "pais")
class Pais extends EntradaCatalogoEntity {

	protected Pais() {
	}

}
