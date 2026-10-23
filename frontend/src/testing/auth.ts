import { Provider, signal } from '@angular/core';
import { AuthService, CurrentUser } from '../app/core/auth/auth.service';
import { HrisRole } from '../app/core/auth/roles';

export const TEST_USER: CurrentUser = {
  id: 'usuario-dm',
  username: 'dm@cleteci.local',
  name: 'Delivery Manager',
  email: 'dm@cleteci.local',
  roles: ['delivery-manager'],
};

/**
 * `AuthService` simulado para tests: sin Keycloak ni red. Cuenta las llamadas a `logout` en lugar
 * de usar `vi.fn()`, porque este fichero también lo compila `tsconfig.app.json` (sin tipos de Vitest).
 */
export class FakeAuthService implements Pick<AuthService, 'user' | 'hasRole' | 'logout'> {
  readonly current = signal<CurrentUser | null>(TEST_USER);
  readonly user = this.current.asReadonly();
  logoutCalls = 0;

  hasRole(role: HrisRole): boolean {
    return this.current()?.roles.includes(role) ?? false;
  }

  logout(): Promise<void> {
    this.logoutCalls++;
    return Promise.resolve();
  }
}

/** Recuperar el doble con `TestBed.inject(AuthService) as unknown as FakeAuthService`. */
export function provideFakeAuth(user: CurrentUser | null = TEST_USER): Provider[] {
  const fake = new FakeAuthService();
  fake.current.set(user);
  return [{ provide: AuthService, useValue: fake }];
}
