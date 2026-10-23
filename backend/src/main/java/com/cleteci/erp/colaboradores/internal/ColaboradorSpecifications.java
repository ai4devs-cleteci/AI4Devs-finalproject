package com.cleteci.erp.colaboradores.internal;

import java.util.ArrayList;
import java.util.Collection;
import java.util.regex.Pattern;

import org.jspecify.annotations.Nullable;

import org.springframework.data.jpa.domain.Specification;

/** Filtros del listado de colaboradores. */
final class ColaboradorSpecifications {

	private static final Pattern SOLO_DIGITOS = Pattern.compile("\\d{1,5}");

	private ColaboradorSpecifications() {
	}

	/** @param proyectosVisibles proyectos a los que se limita el listado, o {@code null} para no limitarlo */
	static Specification<Colaborador> de(BusquedaColaboradores busqueda, @Nullable Collection<String> proyectosVisibles) {
		var filtros = new ArrayList<Specification<Colaborador>>();
		if (busqueda.texto() != null && !busqueda.texto().isBlank()) {
			filtros.add(texto(busqueda.texto()));
		}
		if (busqueda.unidadCodigo() != null) {
			filtros.add((root, query, cb) -> cb.equal(root.get("unidadCodigo"), busqueda.unidadCodigo()));
		}
		if (busqueda.proyectoCodigo() != null) {
			filtros.add((root, query, cb) -> cb.equal(root.get("proyectoCodigo"), busqueda.proyectoCodigo()));
		}
		if (busqueda.estado() != null) {
			filtros.add((root, query, cb) -> cb.equal(root.get("estado"), busqueda.estado()));
		}
		if (proyectosVisibles != null) {
			filtros.add((root, query, cb) -> proyectosVisibles.isEmpty() ? cb.disjunction()
					: root.get("proyectoCodigo").in(proyectosVisibles));
		}
		return Specification.allOf(filtros);
	}

	/** Coincidencia parcial en los nombres (sin acentos ni mayúsculas), en el documento o con el ID. */
	private static Specification<Colaborador> texto(String texto) {
		var nombre = "%" + escaparLike(Normalizacion.texto(texto)) + "%";
		var documento = "%" + escaparLike(Normalizacion.documento(texto)) + "%";
		var termino = texto.strip();
		return (root, query, cb) -> {
			var nombreCoincide = cb.like(root.get("nombreBusqueda"), nombre, '\\');
			var documentoCoincide = cb.like(root.get("documentoNormalizado"), documento, '\\');
			if (SOLO_DIGITOS.matcher(termino).matches()) {
				return cb.or(nombreCoincide, documentoCoincide, cb.equal(root.get("id"), Long.parseLong(termino)));
			}
			return cb.or(nombreCoincide, documentoCoincide);
		};
	}

	private static String escaparLike(String valor) {
		return valor.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

}
