package com.cleteci.erp.plataforma;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;

/** Construye los {@link ProblemDetail} de la API con títulos y detalles en español. */
@Component
class Problemas {

	static final String TIPO_BASE = "https://hris.cleteci.com/problemas/";

	private final Mensajes mensajes;

	Problemas(Mensajes mensajes) {
		this.mensajes = mensajes;
	}

	ProblemDetail crear(HttpStatusCode status, String tipo, String detalle) {
		var problema = ProblemDetail.forStatusAndDetail(status, detalle);
		problema.setType(URI.create(TIPO_BASE + tipo));
		problema.setTitle(mensajes.get("error.titulo." + status.value()));
		return problema;
	}

	/** Problema genérico para un estado, con el detalle por defecto de {@code error.detalle.<estado>}. */
	ProblemDetail generico(HttpStatusCode status) {
		var detalle = mensajes.get("error.detalle." + status.value());
		if (detalle.equals("error.detalle." + status.value())) {
			detalle = mensajes.get("error.detalle." + (status.is5xxServerError() ? 500 : 400));
		}
		return crear(status, "error-" + status.value(), detalle);
	}

	ProblemDetail validacion(List<ErrorDeCampo> errores) {
		var problema = crear(HttpStatusCode.valueOf(400), "validacion", mensajes.get("error.validacion"));
		problema.setProperty("errors", errores);
		return problema;
	}

	/** Error asociado a un campo de la petición. */
	record ErrorDeCampo(String field, String message) {
	}

}
