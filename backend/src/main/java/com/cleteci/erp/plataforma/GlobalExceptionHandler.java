package com.cleteci.erp.plataforma;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DatabindException;

import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.cleteci.erp.plataforma.Problemas.ErrorDeCampo;

/** Traduce todas las excepciones de la API a Problem Details (RFC 9457) en español. */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	private final Problemas problemas;

	private final Mensajes mensajes;

	GlobalExceptionHandler(Problemas problemas, Mensajes mensajes) {
		this.problemas = problemas;
		this.mensajes = mensajes;
	}

	@ExceptionHandler(ErrorDeNegocioException.class)
	ResponseEntity<ProblemDetail> errorDeNegocio(ErrorDeNegocioException ex) {
		var detalle = mensajes.get(ex.codigoMensaje(), ex.argumentos());
		var problema = problemas.crear(ex.status(), ex.tipo(), detalle);
		problema.setProperty("codigo", ex.codigoMensaje());
		ex.propiedades().forEach(problema::setProperty);
		if (ex.campo() != null) {
			problema.setProperty("errors", List.of(new ErrorDeCampo(ex.campo(), detalle)));
		}
		return ResponseEntity.status(ex.status()).body(problema);
	}

	@ExceptionHandler(DatosNoValidosException.class)
	ResponseEntity<ProblemDetail> datosNoValidos(DatosNoValidosException ex) {
		var errores = ex.codigosPorCampo()
			.entrySet()
			.stream()
			.map(error -> new ErrorDeCampo(error.getKey(), mensajes.get(error.getValue())))
			.toList();
		return ResponseEntity.badRequest().body(problemas.validacion(errores));
	}

	/** Dos ediciones simultáneas del mismo registro: la segunda llega con una versión desactualizada. */
	@ExceptionHandler(OptimisticLockingFailureException.class)
	ResponseEntity<ProblemDetail> versionDesactualizada(OptimisticLockingFailureException ex) {
		return errorDeNegocio(ConflictoException.versionDesactualizada());
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ProblemDetail> accesoDenegado(AccessDeniedException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problemas.generico(HttpStatus.FORBIDDEN));
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ProblemDetail> inesperado(Exception ex) {
		log.error("Error no controlado al procesar la petición", ex);
		var status = HttpStatus.INTERNAL_SERVER_ERROR;
		return ResponseEntity.status(status).body(problemas.generico(status));
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		var errores = ex.getBindingResult()
			.getAllErrors()
			.stream()
			.map(error -> new ErrorDeCampo(error instanceof FieldError campo ? campo.getField() : error.getObjectName(),
					mensajes.get(error)))
			.toList();
		return ResponseEntity.badRequest().headers(headers).body(problemas.validacion(errores));
	}

	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		var errores = new ArrayList<ErrorDeCampo>();
		ex.getParameterValidationResults().forEach(resultado -> {
			var nombre = resultado.getMethodParameter().getParameterName();
			resultado.getResolvableErrors()
				.forEach(error -> errores.add(new ErrorDeCampo(nombre, mensajes.get((MessageSourceResolvable) error))));
		});
		return ResponseEntity.badRequest().headers(headers).body(problemas.validacion(errores));
	}

	@Override
	protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		// Un valor que no se puede convertir (p. ej., un enum desconocido) se atribuye a su campo.
		if (ex.getCause() instanceof DatabindException databind && !databind.getPath().isEmpty()) {
			var campo = databind.getPath()
				.stream()
				.map(JacksonException.Reference::getPropertyName)
				.filter(nombre -> nombre != null)
				.collect(Collectors.joining("."));
			if (!campo.isEmpty()) {
				var error = new ErrorDeCampo(campo, mensajes.get("error.valor-no-valido"));
				return ResponseEntity.badRequest().headers(headers).body(problemas.validacion(List.of(error)));
			}
		}
		return ResponseEntity.badRequest().headers(headers).body(problemas.generico(HttpStatus.BAD_REQUEST));
	}

	/** Resto de excepciones de Spring MVC: se conserva el estado y las cabeceras con textos en español. */
	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
			HttpStatusCode statusCode, WebRequest request) {
		return ResponseEntity.status(statusCode).headers(headers).body(problemas.generico(statusCode));
	}

}
