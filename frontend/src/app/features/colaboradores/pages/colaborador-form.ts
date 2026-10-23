import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormField, TreeValidationResult, disabled, form, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { MessageService } from 'primeng/api';
import { ButtonDirective, ButtonLabel } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { VERSION_DESACTUALIZADA, toApiProblem } from '../data/api-problem';
import { CatalogosApi } from '../data/catalogos-api';
import {
  EntradaCatalogo,
  GENERO_LABELS,
  MODALIDAD_LABELS,
  TIPO_DOCUMENTO_LABELS,
  opciones,
} from '../data/colaborador.model';
import { ColaboradoresApi } from '../data/colaboradores-api';
import { CampoErrores } from './campo-errores';
import {
  CAMPOS,
  CampoColaborador,
  OBLIGATORIOS,
  modeloDe,
  modeloVacio,
  peticionDe,
  reglasColaborador,
} from './colaborador-form.model';

/** Alta (`/colaboradores/nuevo`) y edición (`/colaboradores/:id/editar`) por People & Talent. */
@Component({
  selector: 'app-colaborador-form',
  imports: [
    RouterLink,
    FormField,
    InputText,
    Select,
    Message,
    ButtonDirective,
    ButtonLabel,
    LucideArrowLeft,
    CampoErrores,
  ],
  templateUrl: './colaborador-form.html',
})
export class ColaboradorForm {
  private readonly api = inject(ColaboradoresApi);
  private readonly router = inject(Router);
  private readonly avisos = inject(MessageService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly catalogos = inject(CatalogosApi);

  /** ID del colaborador en edición; sin él, es un alta. */
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly titulo = this.id ? 'Editar colaborador' : 'Nuevo colaborador';
  protected readonly volver = this.id ? ['/colaboradores', this.id] : ['/colaboradores'];

  protected readonly cargando = signal(this.id !== null);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly conflicto = signal(false);
  /** Tras el primer intento de guardar se muestran todos los errores, también de campos sin tocar. */
  private readonly intentoGuardar = signal(false);
  private readonly version = signal<number | undefined>(undefined);
  /** El proyecto de un colaborador que ya tiene uno solo lo cambia su Delivery Manager. */
  protected readonly proyectoBloqueado = signal(false);

  protected readonly modelo = signal(modeloVacio());
  protected readonly f = form(this.modelo, (p) => {
    reglasColaborador(p);
    disabled(p.proyectoCodigo, { when: () => this.proyectoBloqueado() });
  });

  private readonly roles = this.catalogos.entradas('roles');
  private readonly niveles = this.catalogos.entradas('niveles');
  private readonly trayectorias = this.catalogos.entradas('trayectorias');
  private readonly unidades = this.catalogos.entradas('unidades-produccion');
  private readonly proyectos = this.catalogos.entradas('proyectos');
  private readonly paises = this.catalogos.entradas('paises');

  protected readonly opciones = {
    tipoDocumento: opciones(TIPO_DOCUMENTO_LABELS),
    genero: [{ codigo: '', nombre: 'Sin especificar' }, ...opciones(GENERO_LABELS)],
    modalidad: opciones(MODALIDAD_LABELS),
    roles: computed(() => [...this.roles.value()]),
    niveles: computed(() =>
      this.niveles.value().map((n) => ({ ...n, nombre: `${n.nombre} (banda ${n.banda})` })),
    ),
    trayectorias: computed(() => conVacio('Sin especificar', this.trayectorias.value())),
    unidades: computed(() => [...this.unidades.value()]),
    proyectos: computed(() => conVacio('Sin proyecto', this.proyectos.value())),
    paises: computed(() => [...this.paises.value()]),
  };

  protected readonly guardando = signal(false);

  constructor() {
    if (this.id) {
      void this.cargar(this.id);
    }
  }

  protected obligatorio(campo: CampoColaborador): boolean {
    return OBLIGATORIOS.includes(campo);
  }

  /**
   * Un error se muestra al salir de un campo que el usuario modificó, o tras intentar guardar.
   * Pasar por un campo sin cambiarlo (con Tab o un clic) no lo marca.
   */
  protected conError(campo: CampoColaborador): boolean {
    const estado = this.f[campo]();
    return estado.invalid() && (this.intentoGuardar() || (estado.dirty() && estado.touched()));
  }

  /** `aria-describedby` de un control: su ayuda (si la tiene) y sus errores visibles. */
  protected describedBy(campo: CampoColaborador, ayuda?: string): string | null {
    const ids = [ayuda, this.conError(campo) ? `error-${campo}` : undefined].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  /** Los `p-select` no admiten `aria-describedby`: el error se añade a su nombre accesible. */
  protected labelledBy(campo: CampoColaborador): string {
    return [`etiqueta-${campo}`, this.conError(campo) ? `error-${campo}` : undefined]
      .filter(Boolean)
      .join(' ');
  }

  protected async guardar(): Promise<void> {
    this.intentoGuardar.set(true);
    this.errorGeneral.set(null);
    this.conflicto.set(false);
    await submit(this.f, {
      action: async () => {
        this.guardando.set(true);
        try {
          const peticion = peticionDe(this.modelo(), this.version());
          const guardado = this.id
            ? await this.api.editar(this.id, peticion)
            : await this.api.alta(peticion);
          this.avisos.add({
            severity: 'success',
            summary: this.id ? 'Cambios guardados' : 'Colaborador creado',
            detail: this.id
              ? `Se actualizó el registro ${guardado.id}.`
              : `${guardado.nombreCorto} se registró con el ID ${guardado.id}.`,
          });
          await this.router.navigate(['/colaboradores', guardado.id]);
          return undefined;
        } catch (error) {
          return this.erroresDelServidor(error);
        } finally {
          this.guardando.set(false);
        }
      },
      onInvalid: () => this.enfocarPrimerError(),
    });
  }

  /** Recarga los datos vigentes tras un conflicto de edición; se pierden los cambios locales. */
  protected async recargar(): Promise<void> {
    if (this.id) {
      this.conflicto.set(false);
      await this.cargar(this.id);
    }
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    try {
      const colaborador = await this.api.obtener(id);
      this.version.set(colaborador.version);
      this.proyectoBloqueado.set(colaborador.proyecto !== null);
      this.modelo.set(modeloDe(colaborador));
      this.f().reset();
      this.intentoGuardar.set(false);
    } catch (error) {
      this.errorCarga.set(
        error instanceof HttpErrorResponse && error.status === 404
          ? `No existe el colaborador ${id}.`
          : toApiProblem(error).detail,
      );
    } finally {
      this.cargando.set(false);
    }
  }

  /** Errores de la API: los de un campo van a ese campo; el resto, al aviso general. */
  private erroresDelServidor(error: unknown): TreeValidationResult {
    const problema = toApiProblem(error);
    if (problema.codigo === VERSION_DESACTUALIZADA) {
      this.conflicto.set(true);
      return undefined;
    }
    const deCampo = problema.errors.filter((e): e is typeof e & { field: CampoColaborador } =>
      (CAMPOS as readonly string[]).includes(e.field),
    );
    if (deCampo.length === 0) {
      this.errorGeneral.set(problema.detail);
      return undefined;
    }
    this.enfocarPrimerError();
    return deCampo.map((e) => ({
      kind: 'servidor',
      message: e.message,
      fieldTree: this.f[e.field],
    }));
  }

  private enfocarPrimerError(): void {
    afterNextRender(
      () => {
        const campo = CAMPOS.find((c) => this.f[c]().invalid());
        const contenedor = campo && this.document.querySelector(`[data-campo="${campo}"]`);
        contenedor?.querySelector<HTMLElement>('input, [role="combobox"], [tabindex="0"]')?.focus();
      },
      { injector: this.injector },
    );
  }
}

function conVacio(etiqueta: string, entradas: readonly EntradaCatalogo[]): EntradaCatalogo[] {
  return [{ codigo: '', nombre: etiqueta }, ...entradas];
}
