package com.cleteci.erp.plataforma;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/** Usuario autenticado de la petición en curso, a partir de su access token. */
@Component
public class UsuarioActual {

	/** {@code preferred_username} del token, o vacío fuera de una petición autenticada. */
	public Optional<String> username() {
		return autenticacion().map(Authentication::getName);
	}

	public boolean tieneRol(String rol) {
		return autenticacion().map(auth -> auth.getAuthorities()
			.stream()
			.anyMatch(authority -> ("ROLE_" + rol).equals(authority.getAuthority()))).orElse(false);
	}

	private static Optional<Authentication> autenticacion() {
		return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
			.filter(JwtAuthenticationToken.class::isInstance);
	}

}
