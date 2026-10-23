package com.cleteci.erp.plataforma;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.cleteci.erp.IntegrationTest;

/**
 * Valida con tokens firmados de verdad (clave RSA local servida como JWKS en lugar de Keycloak) que la
 * API exige el emisor del realm, la audiencia {@code hris-api} y un token vigente.
 */
@IntegrationTest
@Import(PlataformaTestController.class)
class ValidacionTokenTests {

	private static final String ISSUER = "http://localhost:8081/realms/hris";

	private static final KeyPair CLAVES = generarClaves();

	private static final RSAKey JWK = new RSAKey.Builder((RSAPublicKey) CLAVES.getPublic())
		.privateKey((RSAPrivateKey) CLAVES.getPrivate())
		.keyID("test")
		.build();

	/** Sirve las JWKS como lo haría Keycloak; con {@code issuer-uri} Boot sigue validando el emisor. */
	@DynamicPropertySource
	static void jwks(DynamicPropertyRegistry registry) {
		registry.add("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", ValidacionTokenTests::servirJwks);
	}

	@Autowired
	MockMvcTester mvc;

	@Test
	void tokenValidoSeAcepta() {
		assertThat(llamar(firmar(ISSUER, List.of("hris-api"), Instant.now().plus(5, ChronoUnit.MINUTES))))
			.isEqualTo(HttpStatus.OK.value());
	}

	@Test
	void tokenSinAudienciaHrisApiSeRechaza() {
		assertThat(llamar(firmar(ISSUER, List.of("account"), Instant.now().plus(5, ChronoUnit.MINUTES))))
			.isEqualTo(HttpStatus.UNAUTHORIZED.value());
	}

	@Test
	void tokenCaducadoSeRechaza() {
		assertThat(llamar(firmar(ISSUER, List.of("hris-api"), Instant.now().minus(5, ChronoUnit.MINUTES))))
			.isEqualTo(HttpStatus.UNAUTHORIZED.value());
	}

	@Test
	void tokenDeOtroEmisorSeRechaza() {
		assertThat(llamar(firmar("http://localhost:8081/realms/otro", List.of("hris-api"),
				Instant.now().plus(5, ChronoUnit.MINUTES))))
			.isEqualTo(HttpStatus.UNAUTHORIZED.value());
	}

	private int llamar(String token) {
		return mvc.get()
			.uri("/api/prueba/autenticado")
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
			.exchange()
			.getResponse()
			.getStatus();
	}

	private static String firmar(String issuer, List<String> audiencia, Instant expiracion) {
		var encoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(JWK)));
		var claims = JwtClaimsSet.builder()
			.issuer(issuer)
			.subject("pyt")
			.audience(audiencia)
			.issuedAt(expiracion.minus(15, ChronoUnit.MINUTES))
			.expiresAt(expiracion)
			.claim("preferred_username", "pyt@cleteci.local")
			.claim("realm_access", Map.of("roles", List.of("people-talent")))
			.build();
		var header = JwsHeader.with(SignatureAlgorithm.RS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

	private static KeyPair generarClaves() {
		try {
			var generador = KeyPairGenerator.getInstance("RSA");
			generador.initialize(2048);
			return generador.generateKeyPair();
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex);
		}
	}

	private static String servirJwks() {
		try {
			var cuerpo = new JWKSet(JWK.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
			var servidor = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
			servidor.createContext("/jwks", intercambio -> {
				intercambio.getResponseHeaders().add("Content-Type", "application/json");
				intercambio.sendResponseHeaders(200, cuerpo.length);
				intercambio.getResponseBody().write(cuerpo);
				intercambio.close();
			});
			servidor.start();
			return "http://localhost:" + servidor.getAddress().getPort() + "/jwks";
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

}
