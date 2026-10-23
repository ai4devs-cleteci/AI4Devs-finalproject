package com.cleteci.erp.colaboradores.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.cleteci.erp.colaboradores.internal.CalculosColaborador.Antiguedad;
import com.cleteci.erp.colaboradores.internal.CalculosColaborador.Elegibilidad;
import com.cleteci.erp.colaboradores.internal.CalculosColaborador.MotivoNoElegible;

class CalculosColaboradorTests {

	private static final ZoneId ZONA = ZoneId.of("America/Caracas");

	private final CalculosColaborador calculos = new CalculosColaborador(
			Clock.fixed(LocalDate.of(2026, 10, 22).atStartOfDay(ZONA).toInstant(), ZONA));

	@Test
	void antiguedadEnAniosYMesesCompletos() {
		assertThat(calculos.antiguedad(LocalDate.of(2025, 4, 15))).isEqualTo(new Antiguedad(1, 6));
		assertThat(calculos.antiguedad(LocalDate.of(2026, 9, 23))).isEqualTo(new Antiguedad(0, 0));
		assertThat(calculos.antiguedad(LocalDate.of(2026, 10, 22))).isEqualTo(new Antiguedad(0, 0));
	}

	@Test
	void ingresoFuturoTieneAntiguedadCero() {
		assertThat(calculos.antiguedad(LocalDate.of(2026, 12, 1))).isEqualTo(new Antiguedad(0, 0));
	}

	@Test
	void enPeriodoDePruebaNoEsElegibleANada() {
		var elegibilidades = calculos.elegibilidades(EstadoColaborador.EN_ONBOARDING, new Antiguedad(2, 0));
		var noElegible = Elegibilidad.no(MotivoNoElegible.PERIODO_DE_PRUEBA);
		assertThat(elegibilidades.salaryReview()).isEqualTo(noElegible);
		assertThat(elegibilidades.prestamo()).isEqualTo(noElegible);
		assertThat(elegibilidades.descansoRemunerado()).isEqualTo(noElegible);
	}

	@Test
	void activoConOchoMeses() {
		var elegibilidades = calculos.elegibilidades(EstadoColaborador.ACTIVO, new Antiguedad(0, 8));
		assertThat(elegibilidades.prestamo().elegible()).isTrue();
		assertThat(elegibilidades.descansoRemunerado().elegible()).isTrue();
		assertThat(elegibilidades.salaryReview())
			.isEqualTo(Elegibilidad.no(MotivoNoElegible.ANTIGUEDAD_MENOR_1_ANIO));
	}

	@Test
	void activoConMenosDeSeisMeses() {
		var elegibilidades = calculos.elegibilidades(EstadoColaborador.ACTIVO, new Antiguedad(0, 5));
		assertThat(elegibilidades.prestamo()).isEqualTo(Elegibilidad.no(MotivoNoElegible.ANTIGUEDAD_MENOR_6_MESES));
	}

	@Test
	void activoConUnAnioEsElegibleASalaryReview() {
		var elegibilidades = calculos.elegibilidades(EstadoColaborador.ACTIVO, new Antiguedad(1, 0));
		assertThat(elegibilidades.salaryReview().elegible()).isTrue();
	}

	@Test
	void egresadoNoEsElegible() {
		var elegibilidades = calculos.elegibilidades(EstadoColaborador.EGRESADO, new Antiguedad(5, 0));
		assertThat(elegibilidades.descansoRemunerado()).isEqualTo(Elegibilidad.no(MotivoNoElegible.EGRESADO));
	}

}
