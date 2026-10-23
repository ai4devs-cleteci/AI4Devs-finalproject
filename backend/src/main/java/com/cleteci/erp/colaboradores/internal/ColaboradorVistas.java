package com.cleteci.erp.colaboradores.internal;

import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.jspecify.annotations.Nullable;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Antiguedad;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Detalle;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Elegibilidad;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Elegibilidades;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Persona;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Referencia;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Resumen;
import com.cleteci.erp.organizacion.Catalogos;
import com.cleteci.erp.organizacion.TipoCatalogo;

/** Construye las respuestas de la API resolviendo nombres de catálogo y campos derivados y calculados. */
@Component
class ColaboradorVistas {

	private final Catalogos catalogos;

	private final CalculosColaborador calculos;

	private final MessageSource mensajes;

	ColaboradorVistas(Catalogos catalogos, CalculosColaborador calculos, MessageSource mensajes) {
		this.catalogos = catalogos;
		this.calculos = calculos;
		this.mensajes = mensajes;
	}

	Detalle detalle(Colaborador c) {
		var nombres = nombres(List.of(c));
		var nivel = catalogos.nivel(c.getNivelCodigo());
		var proyecto = c.getProyectoCodigo() == null ? null : catalogos.proyecto(c.getProyectoCodigo()).orElse(null);
		var reportaA = proyecto == null || proyecto.deliveryManager() == null ? null
				: new Persona(proyecto.deliveryManager().username(), proyecto.deliveryManager().nombre());
		var antiguedad = calculos.antiguedad(c.getFechaIngreso());
		var elegibilidades = calculos.elegibilidades(c.getEstado(), antiguedad);
		return new Detalle(c.getId().toString(), c.getVersion(), c.getNombreCompleto(), c.getNombreCorto(),
				c.getTipoDocumento(), c.getDocumento(), c.getCorreoPersonal(), c.getTelefono(), c.getFechaNacimiento(),
				c.getGenero(), c.getNacionalidad(), c.getFechaIngreso(),
				nombres.referencia(TipoCatalogo.ROLES, c.getRolCodigo()),
				nombres.referencia(TipoCatalogo.NIVELES, c.getNivelCodigo()),
				nivel.map(n -> n.banda()).orElse(null),
				nombres.referencia(TipoCatalogo.TRAYECTORIAS, c.getTrayectoriaCodigo()),
				nombres.referencia(TipoCatalogo.UNIDADES_PRODUCCION, c.getUnidadCodigo()), c.getModalidad(),
				c.getEstado(), nombres.referencia(TipoCatalogo.PROYECTOS, c.getProyectoCodigo()), reportaA,
				nombres.referencia(TipoCatalogo.PAISES, c.getPaisResidenciaCodigo()),
				new Antiguedad(antiguedad.anios(), antiguedad.meses()),
				new Elegibilidades(elegibilidad(elegibilidades.salaryReview()), elegibilidad(elegibilidades.prestamo()),
						elegibilidad(elegibilidades.descansoRemunerado())));
	}

	/** Filas de una página del listado, con una consulta de nombres por catálogo para toda la página. */
	List<Resumen> resumenes(List<Colaborador> pagina) {
		var nombres = nombres(pagina);
		return pagina.stream()
			.map(c -> new Resumen(c.getId().toString(), c.getNombreCorto(), c.getNombreCompleto(),
					nombres.referencia(TipoCatalogo.ROLES, c.getRolCodigo()),
					nombres.referencia(TipoCatalogo.UNIDADES_PRODUCCION, c.getUnidadCodigo()),
					nombres.referencia(TipoCatalogo.PROYECTOS, c.getProyectoCodigo()), c.getEstado(),
					c.getFechaIngreso()))
			.toList();
	}

	private Elegibilidad elegibilidad(CalculosColaborador.Elegibilidad elegibilidad) {
		var motivo = elegibilidad.motivo() == null ? null
				: mensajes.getMessage("colaborador.motivo." + elegibilidad.motivo().name(), null,
						LocaleContextHolder.getLocale());
		return new Elegibilidad(elegibilidad.elegible(), motivo);
	}

	private Nombres nombres(Collection<Colaborador> colaboradores) {
		Map<TipoCatalogo, Function<Colaborador, @Nullable String>> campos = Map.of(TipoCatalogo.ROLES,
				Colaborador::getRolCodigo, TipoCatalogo.NIVELES, Colaborador::getNivelCodigo, TipoCatalogo.TRAYECTORIAS,
				Colaborador::getTrayectoriaCodigo, TipoCatalogo.UNIDADES_PRODUCCION, Colaborador::getUnidadCodigo,
				TipoCatalogo.PROYECTOS, Colaborador::getProyectoCodigo, TipoCatalogo.PAISES,
				Colaborador::getPaisResidenciaCodigo);
		var porTipo = new EnumMap<TipoCatalogo, Map<String, String>>(TipoCatalogo.class);
		campos.forEach((tipo, campo) -> {
			var codigos = colaboradores.stream().map(campo).filter(Objects::nonNull).collect(Collectors.toSet());
			porTipo.put(tipo, codigos.isEmpty() ? Map.of() : catalogos.nombres(tipo, codigos));
		});
		return new Nombres(porTipo);
	}

	private record Nombres(Map<TipoCatalogo, Map<String, String>> porTipo) {

		@Nullable Referencia referencia(TipoCatalogo tipo, @Nullable String codigo) {
			return codigo == null ? null : new Referencia(codigo, porTipo.get(tipo).getOrDefault(codigo, codigo));
		}

	}

}
