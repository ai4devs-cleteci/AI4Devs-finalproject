import { Routes } from '@angular/router';
import { MessageService } from 'primeng/api';
import { requireRole } from '../../core/auth/require-role';
import { ColaboradoresLayout } from './colaboradores-layout';
import { ColaboradorDetail } from './pages/colaborador-detail';
import { ColaboradorForm } from './pages/colaborador-form';
import { ColaboradorList } from './pages/colaborador-list';

/** Rutas de `/colaboradores`. La feature completa ya es un chunk lazy desde `NAVIGATION`. */
export const COLABORADORES_ROUTES: Routes = [
  {
    path: '',
    component: ColaboradoresLayout,
    providers: [MessageService],
    canActivate: [requireRole('people-talent', 'administracion', 'delivery-manager', 'direccion')],
    children: [
      { path: '', component: ColaboradorList },
      {
        path: 'nuevo',
        title: 'Nuevo colaborador',
        canActivate: [requireRole('people-talent')],
        component: ColaboradorForm,
      },
      { path: ':id', title: 'Ficha del colaborador', component: ColaboradorDetail },
      {
        path: ':id/editar',
        title: 'Editar colaborador',
        canActivate: [requireRole('people-talent')],
        component: ColaboradorForm,
      },
    ],
  },
];
