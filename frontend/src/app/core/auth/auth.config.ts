import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import {
  AutoRefreshTokenService,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  UserActivityService,
  createInterceptorCondition,
  includeBearerTokenInterceptor,
  provideKeycloak,
  withAutoRefreshToken,
} from 'keycloak-angular';
import Keycloak, { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';
import { environment } from '../../../environments/environment';
import { AppEnvironment } from '../../../environments/environment.model';

/** Keycloak publica cada realm como issuer en `<url>/realms/<realm>`. */
export function keycloakConfigFromIssuer(issuer: string, clientId: string): KeycloakConfig {
  const match = /^(https?:\/\/.+?)\/realms\/([^/]+)\/?$/.exec(issuer);
  if (!match) {
    throw new Error(
      `Issuer de Keycloak no válido: "${issuer}". Formato esperado: <url>/realms/<realm>.`,
    );
  }
  const [, url, realm] = match;
  return { url, realm, clientId };
}

/**
 * Con `login-required`, `keycloak-js` redirige al login sin contactar antes con Keycloak: si está
 * caído, el usuario acabaría en la página de error del navegador. Se comprueba antes el
 * documento de descubrimiento del issuer para que el fallo llegue al aviso de `main.ts`.
 */
export async function assertIssuerReachable(issuer: string): Promise<void> {
  const url = `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;
  const response = await fetch(url, { credentials: 'omit' }).catch((error: unknown) => {
    throw new Error(`No se pudo contactar con el proveedor de identidad (${url}).`, {
      cause: error,
    });
  });
  if (!response.ok) {
    throw new Error(`El proveedor de identidad respondió ${response.status} en ${url}.`);
  }
}

/** Sesión obligatoria al arrancar con Authorization Code + PKCE. */
export const AUTH_INIT_OPTIONS: KeycloakInitOptions = {
  onLoad: 'login-required',
  pkceMethod: 'S256',
  // El iframe de sesión depende de cookies de terceros, que los navegadores bloquean.
  checkLoginIframe: false,
};

/** Coincide con la URL base de la API y sus subrutas, no con prefijos más largos (`/api` ≠ `/apix`). */
export function apiUrlPattern(apiUrl: string): RegExp {
  const base = apiUrl.replace(/\/+$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${base}(?:[/?#]|$)`);
}

/**
 * Proveedores de autenticación: Keycloak, renovación del token y `HttpClient` que añade el
 * token solo a la API propia. La inicialización se hace aquí y no con los `initOptions` de
 * `provideKeycloak`, que se traga los errores de `keycloak.init`: un fallo debe impedir el
 * arranque para que `main.ts` muestre el aviso en lugar de un shell sin sesión.
 */
export function provideAuth(env: AppEnvironment = environment): EnvironmentProviders {
  let config: KeycloakConfig;
  try {
    config = keycloakConfigFromIssuer(env.auth.issuer, env.auth.clientId);
  } catch (error) {
    return makeEnvironmentProviders([
      provideAppInitializer(() => {
        throw error;
      }),
    ]);
  }

  return makeEnvironmentProviders([
    provideKeycloak({ config, providers: [AutoRefreshTokenService, UserActivityService] }),
    provideAppInitializer(async () => {
      const keycloak = inject(Keycloak);
      // La caducidad de la sesión la decide el realm; aquí solo se renueva con actividad.
      withAutoRefreshToken({ onInactivityTimeout: 'none' }).configure();
      await assertIssuerReachable(env.auth.issuer);
      const authenticated = await keycloak.init(AUTH_INIT_OPTIONS);
      if (!authenticated) {
        throw new Error('Keycloak terminó la inicialización sin sesión.');
      }
    }),
    provideBearerToken(env.apiUrl),
  ]);
}

/** `HttpClient` que añade `Authorization: Bearer` (renovando antes el token) solo bajo `apiUrl`. */
export function provideBearerToken(apiUrl: string): EnvironmentProviders {
  const condition = createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: apiUrlPattern(apiUrl),
  });
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    { provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG, useValue: [condition] },
  ]);
}
