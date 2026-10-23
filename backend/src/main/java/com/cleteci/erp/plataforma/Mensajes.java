package com.cleteci.erp.plataforma;

import org.springframework.context.MessageSource;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/** Acceso a los textos de {@code messages.properties} en el idioma de la petición. */
@Component
class Mensajes {

	private final MessageSource messageSource;

	Mensajes(MessageSource messageSource) {
		this.messageSource = messageSource;
	}

	String get(String codigo, Object... args) {
		return messageSource.getMessage(codigo, args, codigo, LocaleContextHolder.getLocale());
	}

	String get(MessageSourceResolvable resolvable) {
		return messageSource.getMessage(resolvable, LocaleContextHolder.getLocale());
	}

}
