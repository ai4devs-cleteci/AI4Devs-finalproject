import { HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { EntradaCatalogo, TipoCatalogo } from './colaborador.model';

interface CatalogoResponse {
  readonly items: readonly EntradaCatalogo[];
}

/** Catálogos de solo lectura de la estructura organizacional. */
@Injectable({ providedIn: 'root' })
export class CatalogosApi {
  private readonly base = `${environment.apiUrl}/v1/catalogos`;

  /** Entradas activas de un catálogo; llamar en un contexto de inyección (p. ej., un campo). */
  entradas(tipo: TipoCatalogo): HttpResourceRef<readonly EntradaCatalogo[]> {
    return httpResource<readonly EntradaCatalogo[]>(() => `${this.base}/${tipo}`, {
      defaultValue: [],
      parse: (body) => (body as CatalogoResponse).items,
    });
  }
}
