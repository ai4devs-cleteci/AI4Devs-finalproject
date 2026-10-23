import { Route, Routes } from '@angular/router';
import { provideLucideConfig } from '@lucide/angular';
import { NAVIGATION } from '../navigation';
import { Shell } from './shell';

const loadUnderConstruction = () =>
  import('../../shared/under-construction/under-construction').then((m) => m.UnderConstruction);

/**
 * Rutas que se renderizan dentro del shell. Se cargan bajo demanda junto con el shell para que
 * el catálogo de navegación y Lucide no entren en el bundle inicial: esbuild trata
 * `@lucide/angular` como un único módulo, así que cualquier import eager (incluido
 * `provideLucideConfig`) arrastraría todos los iconos usados a `main`.
 */
export const SHELL_ROUTES: Routes = [
  {
    path: '',
    component: Shell,
    providers: [provideLucideConfig({ size: 20, strokeWidth: 2 })],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      // Cada entrada del catálogo carga su feature o, si aún no existe, la página provisional.
      ...NAVIGATION.flatMap((group) => group.items).map((item): Route =>
        item.loadChildren
          ? { path: item.path, title: item.label, loadChildren: item.loadChildren }
          : { path: item.path, title: item.label, loadComponent: loadUnderConstruction },
      ),
      {
        path: 'sin-acceso',
        title: 'Sin acceso',
        loadComponent: () => import('../../shared/forbidden/forbidden').then((m) => m.Forbidden),
      },
      {
        path: '**',
        title: 'Página no encontrada',
        loadComponent: () => import('../../shared/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
