package com.cleteci.erp.colaboradores.internal;

/**
 * Estado contractual, controlado por el sistema. {@link #EN_ONBOARDING} representa el estado
 * compuesto "En onboarding / Período de prueba"; las transiciones llegarán con el ciclo de vida.
 */
public enum EstadoColaborador {

	EN_ONBOARDING, ACTIVO, EGRESADO

}
