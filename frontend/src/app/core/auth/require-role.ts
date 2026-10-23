import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { HrisRole } from './roles';

/**
 * Deja pasar si el usuario tiene alguno de los roles; si no, lleva a `/sin-acceso`. Es solo una
 * ayuda de navegación: la API sigue siendo quien autoriza cada operación.
 */
export function requireRole(...roles: HrisRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    return roles.some((role) => auth.hasRole(role))
      ? true
      : inject(Router).createUrlTree(['/sin-acceso']);
  };
}
