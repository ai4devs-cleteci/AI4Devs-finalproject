package com.cleteci.erp.plataforma;

import java.util.List;

import org.springframework.data.domain.Page;

/** Página de una colección en la API: objeto de primer nivel con los elementos y su posición. */
public record Pagina<T>(List<T> items, int page, int size, long totalElements, int totalPages) {

	/** @param items elementos de la página ya convertidos a su representación en la API */
	public static <T> Pagina<T> de(Page<?> pagina, List<T> items) {
		return new Pagina<>(items, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(),
				pagina.getTotalPages());
	}

}
