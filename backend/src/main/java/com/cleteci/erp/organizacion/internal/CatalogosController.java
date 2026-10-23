package com.cleteci.erp.organizacion.internal;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jspecify.annotations.Nullable;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cleteci.erp.organizacion.DeliveryManager;
import com.cleteci.erp.organizacion.TipoCatalogo;
import com.cleteci.erp.plataforma.HrisRoles;
import com.cleteci.erp.plataforma.RecursoNoEncontradoException;

@RestController
@RequestMapping("/api/v1/catalogos")
@Tag(name = "Catálogos", description = "Estructura organizacional y job architecture (solo lectura)")
class CatalogosController {

	private final CatalogosService catalogos;

	CatalogosController(CatalogosService catalogos) {
		this.catalogos = catalogos;
	}

	@GetMapping("/{catalogo}")
	@PreAuthorize(HrisRoles.CUALQUIER_ROL_HRIS)
	@Operation(summary = "Entradas activas de un catálogo",
			description = "Catálogos: unidades-produccion, proyectos, roles, niveles, trayectorias, paises.")
	@ApiResponse(responseCode = "200", description = "Entradas activas del catálogo")
	@ApiResponse(responseCode = "404", description = "Catálogo desconocido")
	ResponseEntity<CatalogoResponse> consultar(@PathVariable String catalogo) {
		var tipo = TipoCatalogo.deRuta(catalogo)
			.orElseThrow(() -> new RecursoNoEncontradoException("catalogo.no-encontrado", catalogo));
		List<EntradaResponse> items = switch (tipo) {
			case NIVELES -> catalogos.nivelesActivos()
				.stream()
				.map(nivel -> new EntradaResponse(nivel.codigo(), nivel.nombre(), nivel.banda(), null, null))
				.toList();
			case PROYECTOS -> catalogos.proyectosActivos()
				.stream()
				.map(proyecto -> new EntradaResponse(proyecto.codigo(), proyecto.nombre(), null,
						proyecto.unidadCodigo(), proyecto.deliveryManager()))
				.toList();
			default -> catalogos.activos(tipo)
				.stream()
				.map(entrada -> new EntradaResponse(entrada.codigo(), entrada.nombre(), null, null, null))
				.toList();
		};
		return ResponseEntity.ok(new CatalogoResponse(items));
	}

	record CatalogoResponse(List<EntradaResponse> items) {
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	record EntradaResponse(String codigo, String nombre, @Nullable String banda, @Nullable String unidadCodigo,
			@Nullable DeliveryManager deliveryManager) {
	}

}
