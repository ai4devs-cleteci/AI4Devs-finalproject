package com.cleteci.erp.plataforma;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Traduce los roles de realm del token ({@code realm_access.roles}) a autoridades
 * {@code ROLE_<rol>}, descartando los que no son del HRIS (p. ej., {@code offline_access}).
 */
public class RealmRolesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

	@Override
	public Collection<GrantedAuthority> convert(Jwt jwt) {
		if (!(jwt.getClaims().get("realm_access") instanceof Map<?, ?> realmAccess)
				|| !(realmAccess.get("roles") instanceof Collection<?> roles)) {
			return List.of();
		}
		return roles.stream()
			.filter(String.class::isInstance)
			.map(String.class::cast)
			.filter(HrisRoles.TODOS::contains)
			.<GrantedAuthority>map(role -> new SimpleGrantedAuthority("ROLE_" + role))
			.toList();
	}

}
