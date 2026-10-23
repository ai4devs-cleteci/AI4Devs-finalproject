package com.cleteci.erp.plataforma;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de prueba para ejercitar la seguridad y el manejo de errores sin depender de un módulo.
 * Las clases anidadas se registran al importar esta configuración.
 */
@TestConfiguration(proxyBeanMethods = false)
class PlataformaTestController {

	@Service
	static class ServicioProtegido {

		@PreAuthorize("hasRole('people-talent')")
		String soloPeopleTalent() {
			return "ok";
		}

	}

	record Peticion(@NotBlank String nombre, @Email String correo) {
	}

	@RestController
	@RequestMapping("/api/prueba")
	static class Endpoints {

		private final ServicioProtegido servicio;

		Endpoints(ServicioProtegido servicio) {
			this.servicio = servicio;
		}

		@GetMapping("/autenticado")
		ResponseEntity<String> autenticado() {
			return ResponseEntity.ok("ok");
		}

		@GetMapping("/pyt")
		ResponseEntity<String> pyt() {
			return ResponseEntity.ok(servicio.soloPeopleTalent());
		}

		@GetMapping("/no-encontrado")
		ResponseEntity<String> noEncontrado() {
			throw new RecursoNoEncontradoException("error.detalle.404");
		}

		@GetMapping("/conflicto")
		ResponseEntity<String> conflicto() {
			throw (ConflictoException) new ConflictoException("error.detalle.400").conPropiedad("extra", "valor")
				.enCampo("documento");
		}

		@GetMapping("/error")
		ResponseEntity<String> error() {
			throw new IllegalStateException("detalle interno que no debe filtrarse");
		}

		@PostMapping("/validacion")
		ResponseEntity<String> validacion(@Valid @RequestBody Peticion peticion) {
			return ResponseEntity.ok("ok");
		}

	}

}
