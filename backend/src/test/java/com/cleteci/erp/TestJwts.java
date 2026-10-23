package com.cleteci.erp;

import java.util.List;
import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;

import com.cleteci.erp.plataforma.RealmRolesConverter;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;

/**
 * Tokens simulados con la forma de los del realm {@code hris}: los roles van en
 * {@code realm_access.roles} y pasan por el conversor de roles de la aplicación.
 */
public final class TestJwts {

	public static final String PYT = "pyt@cleteci.local";
	public static final String ADMIN = "admin@cleteci.local";
	public static final String DM = "dm@cleteci.local";
	public static final String DIRECCION = "direccion@cleteci.local";
	public static final String COLABORADOR = "colaborador@cleteci.local";

	private TestJwts() {
	}

	public static JwtRequestPostProcessor usuario(String username, String... roles) {
		return SecurityMockMvcRequestPostProcessors.jwt()
			.jwt(jwt -> claims(jwt, username, roles))
			.authorities(new RealmRolesConverter());
	}

	public static JwtRequestPostProcessor pyt() {
		return usuario(PYT, "people-talent");
	}

	public static JwtRequestPostProcessor admin() {
		return usuario(ADMIN, "administracion");
	}

	public static JwtRequestPostProcessor dm() {
		return usuario(DM, "delivery-manager");
	}

	public static JwtRequestPostProcessor direccion() {
		return usuario(DIRECCION, "direccion");
	}

	public static JwtRequestPostProcessor colaborador() {
		return usuario(COLABORADOR, "colaborador");
	}

	private static void claims(Jwt.Builder jwt, String username, String... roles) {
		jwt.subject(username)
			.claim("preferred_username", username)
			.claim("name", username)
			.claim("realm_access", Map.of("roles", List.of(roles)));
	}

}
