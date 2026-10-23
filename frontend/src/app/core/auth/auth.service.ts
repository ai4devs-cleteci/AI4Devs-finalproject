import { DOCUMENT, Injectable, Signal, computed, effect, inject } from '@angular/core';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import { HrisRole, isHrisRole } from './roles';

/** Perfil del usuario autenticado, obtenido de los claims del access token. */
export interface CurrentUser {
  readonly id: string;
  readonly username: string;
  readonly name: string;
  readonly email: string | null;
  /** Solo los roles de realm del HRIS, sin los que Keycloak asigna por defecto. */
  readonly roles: readonly HrisRole[];
}

/** Única pieza que habla con Keycloak: el resto de la aplicación depende de este servicio. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = inject(Keycloak);
  private readonly events = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly document = inject(DOCUMENT);

  readonly user: Signal<CurrentUser | null> = computed(() => {
    // Cada evento (login, renovación…) puede cambiar el token: se relee al recibirlo.
    this.events();
    return toCurrentUser(this.keycloak.tokenParsed);
  });

  constructor() {
    effect(() => {
      // La sesión ya no es válida en Keycloak (caducada o cerrada): se vuelve a pedir el login.
      if (this.events().type === KeycloakEventType.AuthRefreshError) {
        void this.keycloak.login();
      }
    });
  }

  hasRole(role: HrisRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  /** Cierra la sesión en Keycloak y vuelve a la aplicación, que pedirá de nuevo el login. */
  logout(): Promise<void> {
    return this.keycloak.logout({ redirectUri: `${this.document.location.origin}/` });
  }
}

function toCurrentUser(token: KeycloakTokenParsed | undefined): CurrentUser | null {
  const id = token?.sub;
  if (!token || !id) {
    return null;
  }
  const username = stringClaim(token, 'preferred_username') ?? id;
  return {
    id,
    username,
    name: stringClaim(token, 'name') ?? username,
    email: stringClaim(token, 'email'),
    roles: (token.realm_access?.roles ?? []).filter(isHrisRole),
  };
}

function stringClaim(token: KeycloakTokenParsed, claim: string): string | null {
  const value: unknown = token[claim];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}
