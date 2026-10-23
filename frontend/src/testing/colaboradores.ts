import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CurrentUser } from '../app/core/auth/auth.service';
import {
  ColaboradorDetalle,
  ColaboradorResumen,
  EntradaCatalogo,
  Pagina,
  TipoCatalogo,
} from '../app/features/colaboradores/data/colaborador.model';
import { Forbidden } from '../app/shared/forbidden/forbidden';
import { environment } from '../environments/environment';
import { provideFakeAuth } from './auth';

export const API = `${environment.apiUrl}/v1`;

/** Rutas de la feature montadas sin el shell, con HTTP simulado y el usuario indicado. */
export function provideColaboradoresTesting(user: CurrentUser) {
  return [
    provideRouter([
      {
        path: 'colaboradores',
        loadChildren: () =>
          import('../app/features/colaboradores/colaboradores.routes').then(
            (m) => m.COLABORADORES_ROUTES,
          ),
      },
      { path: 'sin-acceso', component: Forbidden },
    ]),
    provideHttpClient(),
    provideHttpClientTesting(),
    provideFakeAuth(user),
  ];
}

export const CATALOGOS: Readonly<Record<TipoCatalogo, EntradaCatalogo[]>> = {
  'unidades-produccion': [
    { codigo: 'ASSA_ACSEL', nombre: 'Assa Acsel' },
    { codigo: 'SUPERNOVA', nombre: 'Supernova' },
  ],
  proyectos: [
    {
      codigo: 'ASSA_CORE',
      nombre: 'Assa Acsel Core',
      unidadCodigo: 'ASSA_ACSEL',
      deliveryManager: { username: 'dm@cleteci.local', nombre: 'Delivery Manager' },
    },
    {
      codigo: 'PORTAL',
      nombre: 'Portal de clientes',
      unidadCodigo: 'SUPERNOVA',
      deliveryManager: { username: 'otro@cleteci.local', nombre: 'Otro DM' },
    },
  ],
  roles: [{ codigo: 'DESARROLLADOR', nombre: 'Desarrollador/a de software' }],
  niveles: [
    { codigo: 'N1', nombre: 'N1', banda: 'A' },
    { codigo: 'N3', nombre: 'N3', banda: 'B' },
  ],
  trayectorias: [{ codigo: 'TECNICA', nombre: 'Técnica' }],
  paises: [{ codigo: 'VE', nombre: 'Venezuela' }],
};

/** Responde todas las peticiones de catálogos pendientes. */
export function responderCatalogos(http: HttpTestingController): void {
  http
    .match((req) => req.url.startsWith(`${API}/catalogos/`))
    .forEach((req) => {
      const tipo = req.request.url.split('/').pop() as TipoCatalogo;
      req.flush({ items: CATALOGOS[tipo] });
    });
}

export const DETALLE: ColaboradorDetalle = {
  id: '00007',
  version: 2,
  nombreCompleto: 'María José Pérez Rodríguez',
  nombreCorto: 'María Pérez',
  tipoDocumento: 'CEDULA',
  documento: 'V-12.345.678',
  correoPersonal: 'maria.perez@example.com',
  telefono: '+584121234567',
  fechaNacimiento: '1990-05-20',
  genero: 'FEMENINO',
  nacionalidad: 'Venezolana',
  fechaIngreso: '2025-04-15',
  rol: { codigo: 'DESARROLLADOR', nombre: 'Desarrollador/a de software' },
  nivel: { codigo: 'N3', nombre: 'N3' },
  banda: 'B',
  trayectoria: { codigo: 'TECNICA', nombre: 'Técnica' },
  unidadProduccion: { codigo: 'ASSA_ACSEL', nombre: 'Assa Acsel' },
  modalidad: 'NOMINA',
  estado: 'EN_ONBOARDING',
  proyecto: { codigo: 'ASSA_CORE', nombre: 'Assa Acsel Core' },
  reportaA: { username: 'dm@cleteci.local', nombre: 'Delivery Manager' },
  paisResidencia: { codigo: 'VE', nombre: 'Venezuela' },
  antiguedad: { anios: 1, meses: 6 },
  elegibilidades: {
    salaryReview: { elegible: false, motivo: 'En onboarding / período de prueba.' },
    prestamo: { elegible: false, motivo: 'En onboarding / período de prueba.' },
    descansoRemunerado: { elegible: false, motivo: 'En onboarding / período de prueba.' },
  },
};

export function pagina(
  items: ColaboradorResumen[],
  total = items.length,
): Pagina<ColaboradorResumen> {
  return { items, page: 0, size: 20, totalElements: total, totalPages: Math.ceil(total / 20) };
}

export const RESUMEN: ColaboradorResumen = {
  id: DETALLE.id,
  nombreCorto: DETALLE.nombreCorto,
  nombreCompleto: DETALLE.nombreCompleto,
  rol: DETALLE.rol,
  unidadProduccion: DETALLE.unidadProduccion,
  proyecto: DETALLE.proyecto,
  estado: DETALLE.estado,
  fechaIngreso: DETALLE.fechaIngreso,
};

/** Opciones de AXE de la feature: sin contraste (jsdom no calcula estilos) ni `region` (sin shell). */
export const AXE_OPTIONS = {
  runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
};

export function http(): HttpTestingController {
  return TestBed.inject(HttpTestingController);
}
