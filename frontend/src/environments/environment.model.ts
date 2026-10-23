/** Configuración que varía por entorno; cada configuración de build sustituye `environment.ts`. */
export interface AppEnvironment {
  readonly auth: {
    /** Issuer OIDC del realm de Keycloak: `<url de Keycloak>/realms/<realm>`. */
    readonly issuer: string;
    readonly clientId: string;
  };
  /** URL base de la API propia; solo las peticiones bajo ella llevan el token. */
  readonly apiUrl: string;
}
