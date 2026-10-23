import { HttpClient, HttpParams, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BusquedaColaboradores,
  ColaboradorDetalle,
  ColaboradorPeticion,
  ColaboradorResumen,
  Pagina,
} from './colaborador.model';

/** Acceso a `/api/v1/colaboradores`: lecturas reactivas con `httpResource`, escrituras con promesas. */
@Injectable({ providedIn: 'root' })
export class ColaboradoresApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/colaboradores`;

  /** Página del listado que se vuelve a pedir cuando cambian los criterios. */
  listar(
    busqueda: () => BusquedaColaboradores,
  ): HttpResourceRef<Pagina<ColaboradorResumen> | undefined> {
    return httpResource<Pagina<ColaboradorResumen>>(() => ({
      url: this.base,
      params: paramsDe(busqueda()),
    }));
  }

  /** Ficha del colaborador; sin ID no hace la petición. */
  detalle(id: () => string | undefined): HttpResourceRef<ColaboradorDetalle | undefined> {
    return httpResource<ColaboradorDetalle>(() => {
      const actual = id();
      return actual ? `${this.base}/${actual}` : undefined;
    });
  }

  obtener(id: string): Promise<ColaboradorDetalle> {
    return firstValueFrom(this.http.get<ColaboradorDetalle>(`${this.base}/${id}`));
  }

  alta(peticion: ColaboradorPeticion): Promise<ColaboradorDetalle> {
    return firstValueFrom(this.http.post<ColaboradorDetalle>(this.base, peticion));
  }

  editar(id: string, peticion: ColaboradorPeticion): Promise<ColaboradorDetalle> {
    return firstValueFrom(this.http.put<ColaboradorDetalle>(`${this.base}/${id}`, peticion));
  }

  cambiarProyecto(
    id: string,
    version: number,
    proyectoCodigo: string | null,
  ): Promise<ColaboradorDetalle> {
    return firstValueFrom(
      this.http.patch<ColaboradorDetalle>(`${this.base}/${id}/proyecto`, {
        version,
        proyectoCodigo,
      }),
    );
  }

  eliminar(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }
}

/** Solo se envían los filtros con valor; el orden va como `campo,dirección`. */
export function paramsDe(busqueda: BusquedaColaboradores): HttpParams {
  let params = new HttpParams()
    .set('page', busqueda.page)
    .set('size', busqueda.size)
    .set('sort', `${busqueda.sort},${busqueda.dir}`);
  for (const clave of ['q', 'unidad', 'proyecto', 'estado'] as const) {
    const valor = busqueda[clave].trim();
    if (valor) {
      params = params.set(clave, valor);
    }
  }
  return params;
}
