package com.cleteci.erp.plataforma;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.FixedLocaleResolver;

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing(dateTimeProviderRef = "auditingDateTimeProvider")
class PlataformaConfig {

	/** La aplicación solo existe en español; también fuera de Spring MVC (filtros de seguridad). */
	static final Locale ESPANOL = Locale.forLanguageTag("es");

	static {
		LocaleContextHolder.setDefaultLocale(ESPANOL);
	}

	@Bean
	LocaleResolver localeResolver() {
		return new FixedLocaleResolver(ESPANOL);
	}

	@Bean
	Clock clock() {
		return Clock.systemDefaultZone();
	}

	@Bean
	DateTimeProvider auditingDateTimeProvider(Clock clock) {
		return () -> Optional.of(OffsetDateTime.now(clock));
	}

	/** Autor de los cambios: el usuario del token o, fuera de una petición (procesos internos), {@code sistema}. */
	@Bean
	AuditorAware<String> auditorAware(UsuarioActual usuarioActual) {
		return () -> usuarioActual.username().or(() -> Optional.of("sistema"));
	}

}
