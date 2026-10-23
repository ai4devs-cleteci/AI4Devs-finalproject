package com.cleteci.erp.plataforma;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Orígenes del frontend autorizados a llamar a la API desde el navegador. */
@Validated
@ConfigurationProperties("hris.cors")
record HrisCorsProperties(@NotEmpty List<String> allowedOrigins) {
}
