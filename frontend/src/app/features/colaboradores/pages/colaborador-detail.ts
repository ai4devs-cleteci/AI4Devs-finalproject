import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideFolderSync, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { MessageService } from 'primeng/api';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { toApiProblem } from '../data/api-problem';
import { CatalogosApi } from '../data/catalogos-api';
import {
  ColaboradorDetalle,
  Elegibilidad,
  GENERO_LABELS,
  MODALIDAD_LABELS,
  TIPO_DOCUMENTO_LABELS,
} from '../data/colaborador.model';
import { ColaboradoresApi } from '../data/colaboradores-api';
import { antiguedadTexto, fechaCorta } from '../data/fechas';
import { EstadoTag } from './estado-tag';

/** Par etiqueta–valor de una sección de la ficha. */
interface Dato {
  readonly etiqueta: string;
  readonly valor: string;
}

@Component({
  selector: 'app-colaborador-detail',
  imports: [
    RouterLink,
    FormField,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    Dialog,
    Message,
    Select,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    LucideArrowLeft,
    LucideFolderSync,
    LucidePencil,
    LucideTrash2,
    EstadoTag,
  ],
  templateUrl: './colaborador-detail.html',
})
export class ColaboradorDetail {
  private readonly api = inject(ColaboradoresApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly avisos = inject(MessageService);

  protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? undefined)));
  protected readonly ficha = this.api.detalle(this.id);
  protected readonly colaborador = computed(() =>
    this.ficha.hasValue() ? this.ficha.value() : undefined,
  );
  protected readonly noExiste = computed(() => {
    const error = this.ficha.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly errorCarga = computed(() =>
    this.ficha.error() && !this.noExiste() ? toApiProblem(this.ficha.error()).detail : null,
  );

  protected readonly esPeopleTalent = computed(() => this.auth.hasRole('people-talent'));
  protected readonly esDeliveryManager = computed(() => this.auth.hasRole('delivery-manager'));

  /** Pestañas de la ficha; la ficha crecerá con más bloques (datos personales, expediente…). */
  protected readonly secciones = computed(() => {
    const c = this.colaborador();
    return c
      ? [
          { id: 'identidad', titulo: 'Identidad', datos: datosIdentidad(c) },
          { id: 'posicion', titulo: 'Posición y contrato', datos: datosPosicion(c) },
          { id: 'calculados', titulo: 'Datos calculados', datos: datosCalculados(c) },
        ]
      : [];
  });
  protected readonly seccionActiva = signal<string | number>('identidad');

  // Cambio de proyecto (Delivery Manager)
  private readonly proyectos = inject(CatalogosApi).entradas('proyectos');
  protected readonly proyectosPropios = computed(() => [
    { codigo: '', nombre: 'Sin proyecto' },
    ...this.proyectos
      .value()
      .filter((p) => p.deliveryManager?.username === this.auth.user()?.username),
  ]);
  protected readonly dialogoProyecto = signal(false);
  protected readonly cambio = signal({ proyectoCodigo: '' });
  protected readonly cambioForm = form(this.cambio);
  protected readonly errorCambio = signal<string | null>(null);
  protected readonly guardandoCambio = signal(false);

  /** Botón que abrió el diálogo en curso, para devolverle el foco al cerrarlo. */
  private origenDialogo: HTMLElement | null = null;

  private recordarOrigen(evento: Event): void {
    this.origenDialogo = evento.currentTarget instanceof HTMLElement ? evento.currentTarget : null;
  }

  protected abrirCambioProyecto(evento: Event): void {
    this.recordarOrigen(evento);
    this.cambio.set({ proyectoCodigo: this.colaborador()?.proyecto?.codigo ?? '' });
    this.errorCambio.set(null);
    this.dialogoProyecto.set(true);
  }

  protected restaurarFoco(): void {
    setTimeout(() => this.origenDialogo?.focus());
  }

  protected async guardarProyecto(): Promise<void> {
    const c = this.colaborador();
    if (!c) {
      return;
    }
    this.guardandoCambio.set(true);
    try {
      const actualizado = await this.api.cambiarProyecto(
        c.id,
        c.version,
        this.cambio().proyectoCodigo || null,
      );
      this.ficha.set(actualizado);
      this.dialogoProyecto.set(false);
      this.avisos.add({
        severity: 'success',
        summary: 'Proyecto actualizado',
        detail: actualizado.proyecto
          ? `${actualizado.nombreCorto} está ahora en ${actualizado.proyecto.nombre}.`
          : `${actualizado.nombreCorto} ha quedado sin proyecto.`,
      });
    } catch (error) {
      this.errorCambio.set(toApiProblem(error).detail);
    } finally {
      this.guardandoCambio.set(false);
    }
  }

  // Eliminación (People & Talent). Se usa un p-dialog y no p-confirmdialog, que deja en el DOM un
  // host con role="alertdialog" sin nombre aunque esté cerrado (falla AXE).
  protected readonly dialogoEliminar = signal(false);
  protected readonly eliminando = signal(false);

  protected pedirEliminacion(evento: Event): void {
    this.recordarOrigen(evento);
    this.dialogoEliminar.set(true);
  }

  protected async eliminar(): Promise<void> {
    const c = this.colaborador();
    if (c) {
      this.eliminando.set(true);
      await this.confirmarEliminacion(c);
      this.eliminando.set(false);
    }
  }

  private async confirmarEliminacion(c: ColaboradorDetalle): Promise<void> {
    try {
      await this.api.eliminar(c.id);
      this.origenDialogo = null;
      this.dialogoEliminar.set(false);
      this.avisos.add({
        severity: 'success',
        summary: 'Colaborador eliminado',
        detail: `Se eliminó el registro ${c.id} de ${c.nombreCompleto}.`,
      });
      await this.router.navigate(['/colaboradores']);
    } catch (error) {
      this.avisos.add({
        severity: 'error',
        summary: 'No se pudo eliminar',
        detail: toApiProblem(error).detail,
      });
    }
  }
}

function texto(valor: string | null | undefined): string {
  return valor && valor.trim() ? valor : '—';
}

function datosIdentidad(c: ColaboradorDetalle): Dato[] {
  return [
    { etiqueta: 'Nombre completo', valor: c.nombreCompleto },
    { etiqueta: 'Nombre corto', valor: c.nombreCorto },
    { etiqueta: 'Documento', valor: `${TIPO_DOCUMENTO_LABELS[c.tipoDocumento]} ${c.documento}` },
    { etiqueta: 'Correo personal', valor: c.correoPersonal },
    { etiqueta: 'Teléfono', valor: c.telefono },
    { etiqueta: 'Fecha de nacimiento', valor: texto(fechaCorta(c.fechaNacimiento)) },
    { etiqueta: 'Género', valor: c.genero ? GENERO_LABELS[c.genero] : '—' },
    { etiqueta: 'Nacionalidad', valor: texto(c.nacionalidad) },
  ];
}

function datosPosicion(c: ColaboradorDetalle): Dato[] {
  return [
    { etiqueta: 'Fecha de ingreso', valor: fechaCorta(c.fechaIngreso) },
    { etiqueta: 'Rol', valor: c.rol.nombre },
    { etiqueta: 'Nivel', valor: c.nivel.nombre },
    { etiqueta: 'Banda', valor: texto(c.banda) },
    { etiqueta: 'Trayectoria', valor: texto(c.trayectoria?.nombre) },
    { etiqueta: 'Unidad de producción', valor: c.unidadProduccion.nombre },
    { etiqueta: 'Modalidad', valor: MODALIDAD_LABELS[c.modalidad] },
    { etiqueta: 'Proyecto asignado', valor: c.proyecto?.nombre ?? 'Sin proyecto asignado' },
    { etiqueta: 'Reporta a', valor: texto(c.reportaA?.nombre) },
    { etiqueta: 'País de residencia', valor: c.paisResidencia.nombre },
  ];
}

function datosCalculados(c: ColaboradorDetalle): Dato[] {
  return [
    { etiqueta: 'Antigüedad', valor: antiguedadTexto(c.antiguedad) },
    { etiqueta: 'Salary review', valor: elegibilidad(c.elegibilidades.salaryReview) },
    { etiqueta: 'Préstamo', valor: elegibilidad(c.elegibilidades.prestamo) },
    { etiqueta: 'Descanso remunerado', valor: elegibilidad(c.elegibilidades.descansoRemunerado) },
  ];
}

function elegibilidad(e: Elegibilidad): string {
  return e.elegible ? 'Elegible' : `No elegible${e.motivo ? `: ${e.motivo}` : ''}`;
}
