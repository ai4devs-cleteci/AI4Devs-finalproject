/**
 * Registro maestro del colaborador: identidad, posición y contrato, y los datos que el sistema
 * deriva de ellos (banda, línea de reporte, antigüedad y elegibilidades). El resto de módulos del
 * HRIS referencia a los colaboradores por su {@link ColaboradorId}.
 */
@ApplicationModule(displayName = "Colaboradores")
package com.cleteci.erp.colaboradores;

import org.springframework.modulith.ApplicationModule;
