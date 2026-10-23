package com.cleteci.erp.plataforma;

import java.util.Set;

/** Roles de realm del HRIS (Keycloak, realm {@code hris}). */
public final class HrisRoles {

	public static final String PEOPLE_TALENT = "people-talent";
	public static final String ADMINISTRACION = "administracion";
	public static final String DELIVERY_MANAGER = "delivery-manager";
	public static final String DIRECCION = "direccion";
	public static final String COLABORADOR = "colaborador";

	/** Expresión de {@code @PreAuthorize} para cualquier usuario con algún rol del HRIS. */
	public static final String CUALQUIER_ROL_HRIS = "hasAnyRole('people-talent', 'administracion', "
			+ "'delivery-manager', 'direccion', 'colaborador')";

	public static final Set<String> TODOS = Set.of(PEOPLE_TALENT, ADMINISTRACION, DELIVERY_MANAGER,
			DIRECCION, COLABORADOR);

	private HrisRoles() {
	}

}
