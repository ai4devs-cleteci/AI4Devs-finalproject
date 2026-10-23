import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { toApiProblem } from './api-problem';
import { BusquedaColaboradores, ColaboradorPeticion } from './colaborador.model';
import { ColaboradoresApi, paramsDe } from './colaboradores-api';

const BASE = `${environment.apiUrl}/v1/colaboradores`;

const BUSQUEDA: BusquedaColaboradores = {
  q: '',
  unidad: '',
  proyecto: '',
  estado: '',
  page: 0,
  size: 20,
  sort: 'id',
  dir: 'asc',
};

describe('ColaboradoresApi', () => {
  let api: ColaboradoresApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ColaboradoresApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía solo los filtros con valor y el orden como campo,dirección', () => {
    const params = paramsDe({
      ...BUSQUEDA,
      q: ' pérez ',
      unidad: 'SUPERNOVA',
      page: 2,
      sort: 'fechaIngreso',
      dir: 'desc',
    });
    expect(params.toString()).toBe(
      'page=2&size=20&sort=fechaIngreso,desc&q=p%C3%A9rez&unidad=SUPERNOVA',
    );
  });

  it('vuelve a pedir el listado al cambiar los criterios', async () => {
    const busqueda = signal(BUSQUEDA);
    const recurso = TestBed.runInInjectionContext(() => api.listar(busqueda));
    TestBed.inject(ApplicationRef).tick();
    http
      .expectOne(`${BASE}?page=0&size=20&sort=id,asc`)
      .flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });

    busqueda.set({ ...BUSQUEDA, estado: 'ACTIVO' });
    TestBed.inject(ApplicationRef).tick();
    http
      .expectOne(`${BASE}?page=0&size=20&sort=id,asc&estado=ACTIVO`)
      .flush({ items: [], page: 0, size: 20, totalElements: 3, totalPages: 1 });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(recurso.value()?.totalElements).toBe(3);
  });

  it('usa POST, PUT, PATCH y DELETE en las escrituras', async () => {
    const peticion = { nombreCompleto: 'Ana' } as ColaboradorPeticion;
    const alta = api.alta(peticion);
    const altaReq = http.expectOne(BASE);
    expect(altaReq.request.method).toBe('POST');
    altaReq.flush({ id: '00001' });
    expect((await alta).id).toBe('00001');

    void api.editar('00001', peticion);
    expect(http.expectOne(`${BASE}/00001`).request.method).toBe('PUT');

    void api.cambiarProyecto('00001', 3, null);
    const patch = http.expectOne(`${BASE}/00001/proyecto`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ version: 3, proyectoCodigo: null });

    void api.eliminar('00001');
    expect(http.expectOne(`${BASE}/00001`).request.method).toBe('DELETE');
  });
});

describe('toApiProblem', () => {
  it('extrae los errores por campo de un 400', () => {
    const problema = toApiProblem(
      new HttpErrorResponse({
        status: 400,
        error: {
          detail: 'La petición contiene campos no válidos.',
          errors: [{ field: 'telefono', message: 'Formato no válido' }, { nope: true }],
        },
      }),
    );
    expect(problema.status).toBe(400);
    expect(problema.errors).toEqual([{ field: 'telefono', message: 'Formato no válido' }]);
  });

  it('conserva el código y el colaborador existente de un 409', () => {
    const problema = toApiProblem(
      new HttpErrorResponse({
        status: 409,
        error: {
          detail: 'Ya existe un colaborador con ese documento: 00003.',
          codigo: 'colaborador.documento-duplicado',
          colaboradorExistente: '00003',
          errors: [
            { field: 'documento', message: 'Ya existe un colaborador con ese documento: 00003.' },
          ],
        },
      }),
    );
    expect(problema.codigo).toBe('colaborador.documento-duplicado');
    expect(problema.colaboradorExistente).toBe('00003');
  });

  it('da un mensaje en español sin conexión', () => {
    expect(toApiProblem(new HttpErrorResponse({ status: 0 })).detail).toContain(
      'No se pudo contactar',
    );
  });
});
