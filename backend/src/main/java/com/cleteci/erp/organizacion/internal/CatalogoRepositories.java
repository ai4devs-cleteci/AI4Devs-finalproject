package com.cleteci.erp.organizacion.internal;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface UnidadProduccionRepository extends JpaRepository<UnidadProduccion, String> {
}

interface ProyectoRepository extends JpaRepository<Proyecto, String> {

	List<Proyecto> findByDmUsername(String dmUsername);

}

interface RolRepository extends JpaRepository<Rol, String> {
}

interface NivelRepository extends JpaRepository<Nivel, String> {
}

interface TrayectoriaRepository extends JpaRepository<Trayectoria, String> {
}

interface PaisRepository extends JpaRepository<Pais, String> {
}
