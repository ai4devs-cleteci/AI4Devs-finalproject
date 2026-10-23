package com.cleteci.erp.plataforma;

import java.io.IOException;
import java.util.LinkedHashMap;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/**
 * Respuestas 401/403 de la cadena de seguridad con cuerpo Problem Details. Delega en los
 * manejadores estándar de Bearer para conservar la cabecera {@code WWW-Authenticate}.
 */
@Component
class ProblemDetailsSecurityHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

	private final AuthenticationEntryPoint bearerEntryPoint = new BearerTokenAuthenticationEntryPoint();

	private final AccessDeniedHandler bearerAccessDenied = new BearerTokenAccessDeniedHandler();

	private final Problemas problemas;

	private final JsonMapper jsonMapper;

	ProblemDetailsSecurityHandler(Problemas problemas, JsonMapper jsonMapper) {
		this.problemas = problemas;
		this.jsonMapper = jsonMapper;
	}

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) throws IOException, ServletException {
		bearerEntryPoint.commence(request, response, authException);
		escribir(response, HttpStatus.UNAUTHORIZED);
	}

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response,
			AccessDeniedException accessDeniedException) throws IOException, ServletException {
		bearerAccessDenied.handle(request, response, accessDeniedException);
		escribir(response, HttpStatus.FORBIDDEN);
	}

	private void escribir(HttpServletResponse response, HttpStatus status) throws IOException {
		var problema = problemas.generico(status);
		var cuerpo = new LinkedHashMap<String, Object>();
		cuerpo.put("type", problema.getType().toString());
		cuerpo.put("title", problema.getTitle());
		cuerpo.put("status", problema.getStatus());
		cuerpo.put("detail", problema.getDetail());
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		jsonMapper.writeValue(response.getOutputStream(), cuerpo);
	}

}
