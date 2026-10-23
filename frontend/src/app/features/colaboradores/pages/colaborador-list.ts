import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { debounceTime, distinctUntilChanged, map, skip } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CatalogosApi } from '../data/catalogos-api';
import {
  BusquedaColaboradores,
  ESTADO_LABELS,
  EstadoColaborador,
  OrdenColaboradores,
  opciones,
} from '../data/colaborador.model';
import { ColaboradoresApi } from '../data/colaboradores-api';
import { fechaCorta } from '../data/fechas';
import { toApiProblem } from '../data/api-problem';
import { EstadoTag } from './estado-tag';

const POR_PAGINA = 20;
const ORDENES: readonly OrdenColaboradores[] = ['id', 'nombreCorto', 'fechaIngreso'];

/** Lee los criterios del listado de los query params, con valores por defecto si faltan o no son válidos. */
export function busquedaDe(params: ParamMap): BusquedaColaboradores {
  const page = Number(params.get('page'));
  const sort = params.get('sort') as OrdenColaboradores | null;
  const estado = params.get('estado') ?? '';
  return {
    q: params.get('q') ?? '',
    unidad: params.get('unidad') ?? '',
    proyecto: params.get('proyecto') ?? '',
    estado: estado in ESTADO_LABELS ? (estado as EstadoColaborador) : '',
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: POR_PAGINA,
    sort: sort && ORDENES.includes(sort) ? sort : 'id',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

@Component({
  selector: 'app-colaborador-list',
  imports: [
    RouterLink,
    FormField,
    TableModule,
    Paginator,
    Select,
    InputText,
    Message,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    LucidePlus,
    EstadoTag,
  ],
  templateUrl: './colaborador-list.html',
})
export class ColaboradorList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ColaboradoresApi);
  private readonly catalogos = inject(CatalogosApi);

  private readonly auth = inject(AuthService);

  protected readonly puedeCrear = computed(() => this.auth.hasRole('people-talent'));

  /** Criterios vigentes: la URL es la fuente de verdad para que el listado sea enlazable. */
  protected readonly busqueda = toSignal(this.route.queryParamMap.pipe(takeUntilDestroyed()), {
    requireSync: true,
  });
  protected readonly criterios = computed(() => busquedaDe(this.busqueda()));

  protected readonly resultado = this.api.listar(this.criterios);
  protected readonly filas = computed(() => [...(this.resultado.value()?.items ?? [])]);
  protected readonly total = computed(() => this.resultado.value()?.totalElements ?? 0);
  protected readonly error = computed(() =>
    this.resultado.error() ? toApiProblem(this.resultado.error()).detail : null,
  );

  protected readonly unidades = this.catalogos.entradas('unidades-produccion');
  protected readonly proyectos = this.catalogos.entradas('proyectos');
  protected readonly opcionesUnidad = computed(() => [
    { codigo: '', nombre: 'Todas las unidades' },
    ...this.unidades.value(),
  ]);
  protected readonly opcionesProyecto = computed(() => [
    { codigo: '', nombre: 'Todos los proyectos' },
    ...this.proyectos.value(),
  ]);
  protected readonly opcionesEstado = [
    { codigo: '', nombre: 'Todos los estados' },
    ...opciones(ESTADO_LABELS),
  ];

  /** Filtros editables: se aplican a la URL con un retardo para no pedir en cada tecla. */
  protected readonly filtros = signal({
    q: this.criterios().q,
    unidad: this.criterios().unidad,
    proyecto: this.criterios().proyecto,
    estado: this.criterios().estado as string,
  });
  protected readonly filtrosForm = form(this.filtros);

  protected readonly fechaCorta = fechaCorta;

  constructor() {
    toObservable(this.filtros)
      .pipe(
        skip(1),
        debounceTime(300),
        map((filtros) => ({
          q: filtros.q.trim() || null,
          unidad: filtros.unidad || null,
          proyecto: filtros.proyecto || null,
          estado: filtros.estado || null,
        })),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(),
      )
      .subscribe((cambios) => this.aplicar(cambios));
  }

  protected cambiarPagina(evento: PaginatorState): void {
    const page = Math.floor((evento.first ?? 0) / POR_PAGINA);
    this.navegar({ page: page || null });
  }

  /** Alterna la dirección si se pulsa la columna activa; si no, ordena ascendente por ella. */
  protected ordenar(campo: OrdenColaboradores): void {
    const actual = this.criterios();
    const dir = actual.sort === campo && actual.dir === 'asc' ? 'desc' : 'asc';
    this.navegar({
      sort: campo === 'id' ? null : campo,
      dir: dir === 'asc' ? null : dir,
      page: null,
    });
  }

  protected ariaSort(campo: OrdenColaboradores): 'ascending' | 'descending' | 'none' {
    const actual = this.criterios();
    if (actual.sort !== campo) {
      return 'none';
    }
    return actual.dir === 'asc' ? 'ascending' : 'descending';
  }

  /** Cambiar un filtro vuelve a la primera página. */
  private aplicar(cambios: Params): void {
    this.navegar({ ...cambios, page: null });
  }

  private navegar(cambios: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cambios,
      queryParamsHandling: 'merge',
    });
  }
}
