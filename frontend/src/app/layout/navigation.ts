import {
  LucideAward,
  LucideBadgeDollarSign,
  LucideCalendarDays,
  LucideChartColumn,
  LucideHandCoins,
  LucideHouse,
  LucideIcon,
  LucideRefreshCw,
  LucideUserSearch,
  LucideUsers,
} from '@lucide/angular';
import { LoadChildren } from '@angular/router';

export interface NavItem {
  readonly label: string;
  /** Segmento de ruta de primer nivel, sin barra inicial. */
  readonly path: string;
  readonly icon: LucideIcon;
  /** Roles de Keycloak con acceso; sin uso hasta integrar la autenticación. */
  readonly roles?: readonly string[];
  /** Rutas de la feature; sin ellas, el módulo muestra la página provisional. */
  readonly loadChildren?: LoadChildren;
}

export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

/** Catálogo de navegación: fuente única del menú lateral y de las rutas de módulos. */
export const NAVIGATION: readonly NavGroup[] = [
  {
    label: 'Personas',
    items: [
      { label: 'Inicio', path: 'inicio', icon: LucideHouse },
      {
        label: 'Colaboradores',
        path: 'colaboradores',
        icon: LucideUsers,
        loadChildren: () =>
          import('../features/colaboradores/colaboradores.routes').then(
            (m) => m.COLABORADORES_ROUTES,
          ),
      },
      { label: 'Descansos y permisos', path: 'descansos', icon: LucideCalendarDays },
      { label: 'Ciclo de vida', path: 'ciclo-de-vida', icon: LucideRefreshCw },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Selección', path: 'seleccion', icon: LucideUserSearch },
      { label: 'Compensación', path: 'compensacion', icon: LucideBadgeDollarSign },
      { label: 'Skills y certificaciones', path: 'skills', icon: LucideAward },
      { label: 'Préstamos y anticipos', path: 'prestamos', icon: LucideHandCoins },
    ],
  },
  {
    label: 'Análisis',
    items: [{ label: 'Reportes', path: 'reportes', icon: LucideChartColumn }],
  },
];
