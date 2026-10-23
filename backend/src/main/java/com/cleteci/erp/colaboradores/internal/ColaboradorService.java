package com.cleteci.erp.colaboradores.internal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.jspecify.annotations.Nullable;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cleteci.erp.colaboradores.ColaboradorId;
import com.cleteci.erp.organizacion.Catalogos;
import com.cleteci.erp.organizacion.ProyectoInfo;
import com.cleteci.erp.organizacion.TipoCatalogo;
import com.cleteci.erp.plataforma.ConflictoException;
import com.cleteci.erp.plataforma.DatosNoValidosException;
import com.cleteci.erp.plataforma.HrisRoles;
import com.cleteci.erp.plataforma.OperacionNoPermitidaException;
import com.cleteci.erp.plataforma.RecursoNoEncontradoException;
import com.cleteci.erp.plataforma.UsuarioActual;

/**
 * Casos de uso del registro del colaborador. Los permisos por rol se declaran en cada método; el
 * alcance del Delivery Manager (solo su equipo) se aplica aquí.
 */
@Service
@Transactional(readOnly = true)
class ColaboradorService {

	private static final String LECTURA = "hasAnyRole('people-talent', 'administracion', 'delivery-manager', "
			+ "'direccion')";

	private static final String PEOPLE_TALENT = "hasRole('people-talent')";

	private static final String DELIVERY_MANAGER = "hasRole('delivery-manager')";

	/** Roles que ven a todos los colaboradores, sin limitarse a un equipo. */
	private static final Set<String> VEN_TODO = Set.of(HrisRoles.PEOPLE_TALENT, HrisRoles.ADMINISTRACION,
			HrisRoles.DIRECCION);

	private final ColaboradorRepository colaboradores;

	private final Catalogos catalogos;

	private final UsuarioActual usuario;

	ColaboradorService(ColaboradorRepository colaboradores, Catalogos catalogos, UsuarioActual usuario) {
		this.colaboradores = colaboradores;
		this.catalogos = catalogos;
		this.usuario = usuario;
	}

	@Transactional
	@PreAuthorize(PEOPLE_TALENT)
	Colaborador alta(DatosColaborador datos) {
		validarCatalogos(datos, null);
		comprobarDocumentoUnico(datos, null);
		return colaboradores.save(new Colaborador(datos));
	}

	@PreAuthorize(LECTURA)
	Page<Colaborador> buscar(BusquedaColaboradores busqueda, Pageable pagina) {
		return colaboradores.findAll(ColaboradorSpecifications.de(busqueda, proyectosVisibles()), pagina);
	}

	@PreAuthorize(LECTURA)
	Colaborador detalle(ColaboradorId id) {
		return visible(id);
	}

	@Transactional
	@PreAuthorize(PEOPLE_TALENT)
	Colaborador editar(ColaboradorId id, long version, DatosColaborador datos) {
		var colaborador = existente(id);
		comprobarVersion(colaborador, version);
		var cambiaProyecto = colaborador.cambiaProyecto(datos.proyectoCodigo());
		if (cambiaProyecto && colaborador.tieneProyecto()) {
			throw new OperacionNoPermitidaException("colaborador.proyecto-solo-dm").enCampo("proyectoCodigo");
		}
		validarCatalogos(datos, colaborador);
		comprobarDocumentoUnico(datos, colaborador);
		colaborador.actualizar(datos);
		if (cambiaProyecto) {
			colaborador.asignarProyecto(datos.proyectoCodigo());
		}
		return colaboradores.saveAndFlush(colaborador);
	}

	@Transactional
	@PreAuthorize(DELIVERY_MANAGER)
	Colaborador cambiarProyecto(ColaboradorId id, long version, @Nullable String proyectoCodigo) {
		var propios = proyectosDelUsuario();
		var colaborador = existente(id);
		if (!colaborador.tieneProyecto() || !propios.contains(colaborador.getProyectoCodigo())) {
			throw noEncontrado(id);
		}
		comprobarVersion(colaborador, version);
		if (proyectoCodigo != null) {
			if (!propios.contains(proyectoCodigo)) {
				throw new OperacionNoPermitidaException("colaborador.proyecto-ajeno").enCampo("proyectoCodigo");
			}
			if (!catalogos.existeActivo(TipoCatalogo.PROYECTOS, proyectoCodigo)) {
				throw new DatosNoValidosException(Map.of("proyectoCodigo", "colaborador.catalogo-no-valido"));
			}
		}
		colaborador.asignarProyecto(proyectoCodigo);
		return colaboradores.saveAndFlush(colaborador);
	}

	@Transactional
	@PreAuthorize(PEOPLE_TALENT)
	void eliminar(ColaboradorId id) {
		colaboradores.delete(existente(id));
	}

	private Colaborador existente(ColaboradorId id) {
		return colaboradores.findById(id.valor()).orElseThrow(() -> noEncontrado(id));
	}

	/** Ficha visible para el usuario: fuera de su alcance se responde como si no existiera. */
	private Colaborador visible(ColaboradorId id) {
		var colaborador = existente(id);
		var proyectosVisibles = proyectosVisibles();
		if (proyectosVisibles != null
				&& (!colaborador.tieneProyecto() || !proyectosVisibles.contains(colaborador.getProyectoCodigo()))) {
			throw noEncontrado(id);
		}
		return colaborador;
	}

	/** Proyectos a los que se limita el usuario, o {@code null} si ve a todos los colaboradores. */
	private @Nullable Set<String> proyectosVisibles() {
		return VEN_TODO.stream().anyMatch(usuario::tieneRol) ? null : proyectosDelUsuario();
	}

	private Set<String> proyectosDelUsuario() {
		return usuario.username()
			.map(catalogos::proyectosDe)
			.orElse(List.of())
			.stream()
			.map(ProyectoInfo::codigo)
			.collect(Collectors.toUnmodifiableSet());
	}

	private static void comprobarVersion(Colaborador colaborador, long version) {
		if (colaborador.getVersion() != version) {
			throw ConflictoException.versionDesactualizada();
		}
	}

	private void comprobarDocumentoUnico(DatosColaborador datos, @Nullable Colaborador actual) {
		colaboradores
			.findByTipoDocumentoAndDocumentoNormalizado(datos.tipoDocumento(), Normalizacion.documento(datos.documento()))
			.filter(otro -> actual == null || !otro.getId().equals(actual.getId()))
			.ifPresent(otro -> {
				throw new ConflictoException("colaborador.documento-duplicado", otro.getId().toString())
					.conPropiedad("colaboradorExistente", otro.getId().toString())
					.enCampo("documento");
			});
	}

	/**
	 * Los códigos de catálogo deben existir y estar activos. En una edición, un código que no cambia
	 * se acepta aunque su entrada se haya desactivado después del alta.
	 */
	private void validarCatalogos(DatosColaborador datos, @Nullable Colaborador actual) {
		var errores = new LinkedHashMap<String, String>();
		validar(errores, "rolCodigo", TipoCatalogo.ROLES, datos.rolCodigo(),
				actual == null ? null : actual.getRolCodigo());
		validar(errores, "nivelCodigo", TipoCatalogo.NIVELES, datos.nivelCodigo(),
				actual == null ? null : actual.getNivelCodigo());
		validar(errores, "trayectoriaCodigo", TipoCatalogo.TRAYECTORIAS, datos.trayectoriaCodigo(),
				actual == null ? null : actual.getTrayectoriaCodigo());
		validar(errores, "unidadCodigo", TipoCatalogo.UNIDADES_PRODUCCION, datos.unidadCodigo(),
				actual == null ? null : actual.getUnidadCodigo());
		validar(errores, "paisResidenciaCodigo", TipoCatalogo.PAISES, datos.paisResidenciaCodigo(),
				actual == null ? null : actual.getPaisResidenciaCodigo());
		validar(errores, "proyectoCodigo", TipoCatalogo.PROYECTOS, datos.proyectoCodigo(),
				actual == null ? null : actual.getProyectoCodigo());
		if (!errores.isEmpty()) {
			throw new DatosNoValidosException(errores);
		}
	}

	private void validar(Map<String, String> errores, String campo, TipoCatalogo tipo, @Nullable String codigo,
			@Nullable String codigoActual) {
		if (codigo != null && !codigo.equals(codigoActual) && !catalogos.existeActivo(tipo, codigo)) {
			errores.put(campo, "colaborador.catalogo-no-valido");
		}
	}

	private static RecursoNoEncontradoException noEncontrado(ColaboradorId id) {
		return new RecursoNoEncontradoException("colaborador.no-encontrado", id.toString());
	}

}
