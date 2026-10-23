/**
 * Infraestructura compartida por todos los módulos: seguridad de la API, CORS, formato de errores
 * (Problem Details) y acceso al usuario autenticado. Es un módulo abierto porque no es dominio.
 */
@ApplicationModule(type = ApplicationModule.Type.OPEN)
package com.cleteci.erp.plataforma;

import org.springframework.modulith.ApplicationModule;
