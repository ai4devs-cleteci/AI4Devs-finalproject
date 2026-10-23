package com.cleteci.erp.colaboradores.internal;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.groups.Default;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jspecify.annotations.Nullable;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.cleteci.erp.colaboradores.ColaboradorId;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Detalle;
import com.cleteci.erp.colaboradores.internal.ColaboradorResponses.Resumen;
import com.cleteci.erp.plataforma.DatosNoValidosException;
import com.cleteci.erp.plataforma.Pagina;
import com.cleteci.erp.plataforma.RecursoNoEncontradoException;

@RestController
@RequestMapping("/api/v1/colaboradores")
@Tag(name = "Colaboradores", description = "Registro del colaborador: identidad, posición y contrato")
@ApiResponse(responseCode = "401", description = "Sin token válido",
		content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
@ApiResponse(responseCode = "403", description = "El rol del usuario no permite la operación",
		content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
class ColaboradoresController {

	private static final String ID = "{id:\\d{1,5}}";

	/** Campos por los que se puede ordenar el listado. */
	private static final Set<String> ORDENABLES = Set.of("id", "nombreCorto", "fechaIngreso");

	private final ColaboradorService servicio;

	private final ColaboradorVistas vistas;

	ColaboradoresController(ColaboradorService servicio, ColaboradorVistas vistas) {
		this.servicio = servicio;
		this.vistas = vistas;
	}

	@GetMapping
	@Operation(summary = "Listado paginado de colaboradores",
			description = "P&T, Dirección y Administración ven a todos; el Delivery Manager, solo a su equipo.")
	@ApiResponse(responseCode = "200", description = "Página de colaboradores")
	@ApiResponse(responseCode = "400", description = "Parámetros de paginación u orden no válidos",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	ResponseEntity<Pagina<Resumen>> listar(
			@Parameter(description = "Texto a buscar en el ID, los nombres o el documento") @RequestParam(
					required = false) @Nullable String q,
			@RequestParam(required = false) @Nullable String unidad,
			@RequestParam(required = false) @Nullable String proyecto,
			@RequestParam(required = false) @Nullable EstadoColaborador estado,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
			@Parameter(description = "Campo y dirección: id, nombreCorto o fechaIngreso, con ,asc o ,desc") @RequestParam(
					defaultValue = "id,asc") String sort) {
		var resultado = servicio.buscar(new BusquedaColaboradores(q, unidad, proyecto, estado),
				PageRequest.of(page, size, orden(sort)));
		return ResponseEntity.ok(Pagina.de(resultado, vistas.resumenes(resultado.getContent())));
	}

	@PostMapping
	@Operation(summary = "Alta de un colaborador (People & Talent)")
	@ApiResponse(responseCode = "201", description = "Colaborador creado; Location apunta a su ficha")
	@ApiResponse(responseCode = "400", description = "Campos obligatorios ausentes o no válidos",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	@ApiResponse(responseCode = "409", description = "Ya existe un colaborador con ese documento",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	ResponseEntity<Detalle> alta(@Valid @RequestBody ColaboradorRequest peticion) {
		var colaborador = servicio.alta(peticion.toDatos());
		var ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
			.path("/{id}")
			.buildAndExpand(colaborador.getId().toString())
			.toUri();
		return ResponseEntity.created(ubicacion).body(vistas.detalle(colaborador));
	}

	@GetMapping("/" + ID)
	@Operation(summary = "Ficha de un colaborador")
	@ApiResponse(responseCode = "200", description = "Ficha con campos derivados y calculados")
	@ApiResponse(responseCode = "404", description = "No existe o no es visible para el usuario",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	ResponseEntity<Detalle> detalle(@PathVariable String id) {
		return ResponseEntity.ok(vistas.detalle(servicio.detalle(id(id))));
	}

	@PutMapping("/" + ID)
	@Operation(summary = "Edición de un colaborador (People & Talent)",
			description = "Requiere la versión leída. El proyecto solo se puede fijar si el colaborador no tiene uno.")
	@ApiResponse(responseCode = "200", description = "Colaborador actualizado")
	@ApiResponse(responseCode = "404", description = "No existe",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	@ApiResponse(responseCode = "409", description = "Versión desactualizada o documento duplicado",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	ResponseEntity<Detalle> editar(@PathVariable String id,
			@Validated({ Default.class, ColaboradorRequest.Edicion.class }) @RequestBody ColaboradorRequest peticion) {
		return ResponseEntity.ok(vistas.detalle(servicio.editar(id(id), peticion.version(), peticion.toDatos())));
	}

	@PatchMapping("/" + ID + "/proyecto")
	@Operation(summary = "Cambio de proyecto por el Delivery Manager",
			description = "Entre proyectos propios, o sin proyecto si proyectoCodigo es nulo.")
	@ApiResponse(responseCode = "200", description = "Proyecto actualizado")
	@ApiResponse(responseCode = "404", description = "El colaborador no es de su equipo",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	@ApiResponse(responseCode = "409", description = "Versión desactualizada",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	ResponseEntity<Detalle> cambiarProyecto(@PathVariable String id, @Valid @RequestBody CambioProyectoRequest peticion) {
		var proyecto = peticion.proyectoCodigo() == null || peticion.proyectoCodigo().isBlank() ? null
				: peticion.proyectoCodigo();
		return ResponseEntity.ok(vistas.detalle(servicio.cambiarProyecto(id(id), peticion.version(), proyecto)));
	}

	@DeleteMapping("/" + ID)
	@Operation(summary = "Eliminación de un alta errónea (People & Talent)",
			description = "Borra el registro definitivamente; la salida de la organización es un egreso.")
	@ApiResponse(responseCode = "204", description = "Eliminado")
	@ApiResponse(responseCode = "404", description = "No existe",
			content = @Content(mediaType = "application/problem+json",
					schema = @Schema(implementation = ProblemDetail.class)))
	ResponseEntity<Void> eliminar(@PathVariable String id) {
		servicio.eliminar(id(id));
		return ResponseEntity.noContent().build();
	}

	private static ColaboradorId id(String texto) {
		return ColaboradorId.parse(texto)
			.orElseThrow(() -> new RecursoNoEncontradoException("colaborador.no-encontrado",
					texto));
	}

	/** {@code campo,dir}; el ID desempata para que la paginación sea estable. */
	private static Sort orden(String sort) {
		var partes = sort.split(",");
		var campo = partes[0].strip();
		var direccion = partes.length > 1 ? Sort.Direction.fromOptionalString(partes[1].strip()) : Optional.of(Sort.Direction.ASC);
		if (!ORDENABLES.contains(campo) || direccion.isEmpty() || partes.length > 2) {
			throw new DatosNoValidosException(Map.of("sort", "colaborador.orden-no-valido"));
		}
		var orden = Sort.by(direccion.get(), campo);
		return campo.equals("id") ? orden : orden.and(Sort.by("id"));
	}

}
