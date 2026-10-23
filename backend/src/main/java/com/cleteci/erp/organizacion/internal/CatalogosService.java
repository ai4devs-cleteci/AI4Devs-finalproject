package com.cleteci.erp.organizacion.internal;

import java.text.Collator;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.organizacion.Catalogos;
import com.cleteci.erp.organizacion.EntradaCatalogo;
import com.cleteci.erp.organizacion.NivelInfo;
import com.cleteci.erp.organizacion.ProyectoInfo;
import com.cleteci.erp.organizacion.TipoCatalogo;

@Service
@Transactional(readOnly = true)
class CatalogosService implements Catalogos {

	private static final Collator COLLATOR = Collator.getInstance(Locale.forLanguageTag("es"));

	private final Map<TipoCatalogo, JpaRepository<? extends EntradaCatalogoEntity, String>> repositorios;

	private final NivelRepository niveles;

	private final ProyectoRepository proyectos;

	CatalogosService(UnidadProduccionRepository unidades, ProyectoRepository proyectos, RolRepository roles,
			NivelRepository niveles, TrayectoriaRepository trayectorias, PaisRepository paises) {
		this.niveles = niveles;
		this.proyectos = proyectos;
		this.repositorios = new EnumMap<>(Map.of(TipoCatalogo.UNIDADES_PRODUCCION, unidades, TipoCatalogo.PROYECTOS,
				proyectos, TipoCatalogo.ROLES, roles, TipoCatalogo.NIVELES, niveles, TipoCatalogo.TRAYECTORIAS,
				trayectorias, TipoCatalogo.PAISES, paises));
	}

	@Override
	public List<EntradaCatalogo> activos(TipoCatalogo tipo) {
		if (tipo == TipoCatalogo.NIVELES) {
			return niveles.findAll()
				.stream()
				.filter(Nivel::isActivo)
				.sorted(Comparator.comparing(Nivel::getOrden))
				.map(EntradaCatalogoEntity::toEntrada)
				.toList();
		}
		return repositorios.get(tipo)
			.findAll()
			.stream()
			.filter(EntradaCatalogoEntity::isActivo)
			.sorted(Comparator.comparing(EntradaCatalogoEntity::getNombre, COLLATOR))
			.map(EntradaCatalogoEntity::toEntrada)
			.toList();
	}

	/** Niveles activos con su banda, en orden N1–N6. */
	List<NivelInfo> nivelesActivos() {
		return niveles.findAll()
			.stream()
			.filter(Nivel::isActivo)
			.sorted(Comparator.comparing(Nivel::getOrden))
			.map(Nivel::toInfo)
			.toList();
	}

	/** Proyectos activos con su unidad y Delivery Manager, ordenados por nombre. */
	List<ProyectoInfo> proyectosActivos() {
		return proyectos.findAll()
			.stream()
			.filter(Proyecto::isActivo)
			.map(Proyecto::toInfo)
			.sorted(Comparator.comparing(ProyectoInfo::nombre, COLLATOR))
			.toList();
	}

	@Override
	public boolean existeActivo(TipoCatalogo tipo, String codigo) {
		return repositorios.get(tipo).findById(codigo).filter(EntradaCatalogoEntity::isActivo).isPresent();
	}

	@Override
	public Optional<NivelInfo> nivel(String codigo) {
		return niveles.findById(codigo).map(Nivel::toInfo);
	}

	@Override
	public Optional<ProyectoInfo> proyecto(String codigo) {
		return proyectos.findById(codigo).map(Proyecto::toInfo);
	}

	@Override
	public List<ProyectoInfo> proyectosDe(String dmUsername) {
		return proyectos.findByDmUsername(dmUsername).stream().map(Proyecto::toInfo).toList();
	}

	@Override
	public Map<String, String> nombres(TipoCatalogo tipo, Collection<String> codigos) {
		return repositorios.get(tipo)
			.findAllById(codigos)
			.stream()
			.collect(Collectors.toMap(EntradaCatalogoEntity::getCodigo, EntradaCatalogoEntity::getNombre));
	}

}
