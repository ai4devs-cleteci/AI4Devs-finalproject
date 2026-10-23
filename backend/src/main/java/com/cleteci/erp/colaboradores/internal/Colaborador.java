package com.cleteci.erp.colaboradores.internal;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import org.jspecify.annotations.Nullable;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.cleteci.erp.colaboradores.ColaboradorId;

/**
 * Registro del colaborador. Referencia los catálogos de {@code organizacion} por su código: no hay
 * asociaciones JPA entre módulos.
 */
@Entity
@Table(name = "colaborador")
@EntityListeners(AuditingEntityListener.class)
class Colaborador {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "colaborador_id")
	@SequenceGenerator(name = "colaborador_id", sequenceName = "colaborador_id_seq", allocationSize = 1)
	private Long id;

	@Version
	private long version;

	@Column(nullable = false)
	private String nombreCompleto;

	@Column(nullable = false)
	private String nombreCorto;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TipoDocumento tipoDocumento;

	@Column(nullable = false)
	private String documento;

	@Column(nullable = false)
	private String documentoNormalizado;

	@Column(nullable = false)
	private String correoPersonal;

	@Column(nullable = false)
	private String telefono;

	private LocalDate fechaNacimiento;

	@Enumerated(EnumType.STRING)
	private Genero genero;

	private String nacionalidad;

	@Column(nullable = false)
	private LocalDate fechaIngreso;

	@Column(nullable = false)
	private String rolCodigo;

	@Column(nullable = false)
	private String nivelCodigo;

	private String trayectoriaCodigo;

	@Column(nullable = false)
	private String unidadCodigo;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Modalidad modalidad;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private EstadoColaborador estado;

	private String proyectoCodigo;

	@Column(nullable = false)
	private String paisResidenciaCodigo;

	@Column(nullable = false)
	private String nombreBusqueda;

	@CreatedDate
	@Column(nullable = false, updatable = false)
	private OffsetDateTime creadoEn;

	@CreatedBy
	@Column(nullable = false, updatable = false)
	private String creadoPor;

	@LastModifiedDate
	@Column(nullable = false)
	private OffsetDateTime modificadoEn;

	@LastModifiedBy
	@Column(nullable = false)
	private String modificadoPor;

	protected Colaborador() {
	}

	/** Alta: el estado inicial lo fija el sistema y el ID lo asigna la secuencia al guardar. */
	Colaborador(DatosColaborador datos) {
		this.estado = EstadoColaborador.EN_ONBOARDING;
		this.proyectoCodigo = datos.proyectoCodigo();
		actualizar(datos);
	}

	/** Aplica los datos editables por P&T; el proyecto se cambia aparte (ver {@link #asignarProyecto}). */
	void actualizar(DatosColaborador datos) {
		this.nombreCompleto = datos.nombreCompleto().strip();
		this.nombreCorto = datos.nombreCorto().strip();
		this.tipoDocumento = datos.tipoDocumento();
		this.documento = datos.documento().strip();
		this.documentoNormalizado = Normalizacion.documento(datos.documento());
		this.correoPersonal = datos.correoPersonal().strip();
		this.telefono = datos.telefono().strip();
		this.fechaNacimiento = datos.fechaNacimiento();
		this.genero = datos.genero();
		this.nacionalidad = vacioANull(datos.nacionalidad());
		this.fechaIngreso = datos.fechaIngreso();
		this.rolCodigo = datos.rolCodigo();
		this.nivelCodigo = datos.nivelCodigo();
		this.trayectoriaCodigo = datos.trayectoriaCodigo();
		this.unidadCodigo = datos.unidadCodigo();
		this.modalidad = datos.modalidad();
		this.paisResidenciaCodigo = datos.paisResidenciaCodigo();
		this.nombreBusqueda = Normalizacion.texto(this.nombreCompleto + " " + this.nombreCorto);
	}

	void asignarProyecto(@Nullable String proyectoCodigo) {
		this.proyectoCodigo = proyectoCodigo;
	}

	boolean tieneProyecto() {
		return proyectoCodigo != null;
	}

	boolean cambiaProyecto(@Nullable String proyectoCodigo) {
		return !Objects.equals(this.proyectoCodigo, proyectoCodigo);
	}

	private static @Nullable String vacioANull(@Nullable String valor) {
		return valor == null || valor.isBlank() ? null : valor.strip();
	}

	ColaboradorId getId() {
		return new ColaboradorId(id);
	}

	long getVersion() {
		return version;
	}

	String getNombreCompleto() {
		return nombreCompleto;
	}

	String getNombreCorto() {
		return nombreCorto;
	}

	TipoDocumento getTipoDocumento() {
		return tipoDocumento;
	}

	String getDocumento() {
		return documento;
	}

	String getCorreoPersonal() {
		return correoPersonal;
	}

	String getTelefono() {
		return telefono;
	}

	@Nullable LocalDate getFechaNacimiento() {
		return fechaNacimiento;
	}

	@Nullable Genero getGenero() {
		return genero;
	}

	@Nullable String getNacionalidad() {
		return nacionalidad;
	}

	LocalDate getFechaIngreso() {
		return fechaIngreso;
	}

	String getRolCodigo() {
		return rolCodigo;
	}

	String getNivelCodigo() {
		return nivelCodigo;
	}

	@Nullable String getTrayectoriaCodigo() {
		return trayectoriaCodigo;
	}

	String getUnidadCodigo() {
		return unidadCodigo;
	}

	Modalidad getModalidad() {
		return modalidad;
	}

	EstadoColaborador getEstado() {
		return estado;
	}

	@Nullable String getProyectoCodigo() {
		return proyectoCodigo;
	}

	String getPaisResidenciaCodigo() {
		return paisResidenciaCodigo;
	}

}
