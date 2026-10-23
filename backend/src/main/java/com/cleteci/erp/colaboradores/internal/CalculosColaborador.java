package com.cleteci.erp.colaboradores.internal;

import java.time.Clock;
import java.time.LocalDate;
import java.time.Period;

import org.jspecify.annotations.Nullable;

import org.springframework.stereotype.Component;

/** Campos que el sistema calcula en cada lectura a partir de la fecha de ingreso y el estado. */
@Component
class CalculosColaborador {

	static final int MESES_SALARY_REVIEW = 12;

	static final int MESES_PRESTAMO = 6;

	private final Clock clock;

	CalculosColaborador(Clock clock) {
		this.clock = clock;
	}

	/** Años y meses completos desde el ingreso; 0 y 0 si el ingreso es futuro. */
	Antiguedad antiguedad(LocalDate fechaIngreso) {
		var hoy = LocalDate.now(clock);
		if (fechaIngreso.isAfter(hoy)) {
			return new Antiguedad(0, 0);
		}
		var periodo = Period.between(fechaIngreso, hoy);
		return new Antiguedad(periodo.getYears(), periodo.getMonths());
	}

	Elegibilidades elegibilidades(EstadoColaborador estado, Antiguedad antiguedad) {
		// No existe aún el módulo de préstamos: nadie tiene un préstamo activo.
		// TODO: consultar los préstamos activos cuando exista el módulo de préstamos y anticipos.
		var tienePrestamoActivo = false;
		var bloqueo = switch (estado) {
			case EN_ONBOARDING -> MotivoNoElegible.PERIODO_DE_PRUEBA;
			case EGRESADO -> MotivoNoElegible.EGRESADO;
			case ACTIVO -> null;
		};
		if (bloqueo != null) {
			var noElegible = Elegibilidad.no(bloqueo);
			return new Elegibilidades(noElegible, noElegible, noElegible);
		}
		var meses = antiguedad.totalMeses();
		return new Elegibilidades(
				meses >= MESES_SALARY_REVIEW ? Elegibilidad.SI : Elegibilidad.no(MotivoNoElegible.ANTIGUEDAD_MENOR_1_ANIO),
				tienePrestamoActivo ? Elegibilidad.no(MotivoNoElegible.PRESTAMO_ACTIVO)
						: meses >= MESES_PRESTAMO ? Elegibilidad.SI
								: Elegibilidad.no(MotivoNoElegible.ANTIGUEDAD_MENOR_6_MESES),
				Elegibilidad.SI);
	}

	record Antiguedad(int anios, int meses) {

		int totalMeses() {
			return anios * 12 + meses;
		}

	}

	record Elegibilidades(Elegibilidad salaryReview, Elegibilidad prestamo, Elegibilidad descansoRemunerado) {
	}

	record Elegibilidad(boolean elegible, @Nullable MotivoNoElegible motivo) {

		static final Elegibilidad SI = new Elegibilidad(true, null);

		static Elegibilidad no(MotivoNoElegible motivo) {
			return new Elegibilidad(false, motivo);
		}

	}

	/** Motivo por el que no se es elegible; su texto está en {@code colaborador.motivo.<nombre>}. */
	enum MotivoNoElegible {

		PERIODO_DE_PRUEBA, EGRESADO, ANTIGUEDAD_MENOR_1_ANIO, ANTIGUEDAD_MENOR_6_MESES, PRESTAMO_ACTIVO

	}

}
