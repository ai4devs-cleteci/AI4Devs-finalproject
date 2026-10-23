/**
 * Estructura organizacional y job architecture: unidades de producción, proyectos con su Delivery
 * Manager, roles, niveles con banda, trayectorias y países. Por ahora son catálogos de solo lectura
 * cargados por migración; los demás módulos los consultan a través de {@link Catalogos}.
 */
@ApplicationModule(displayName = "Organización")
package com.cleteci.erp.organizacion;

import org.springframework.modulith.ApplicationModule;
