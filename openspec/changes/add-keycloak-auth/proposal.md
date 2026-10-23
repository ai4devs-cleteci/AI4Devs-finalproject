# Proposal

## Why

El shell del frontend ya existe, pero cualquiera puede abrirlo sin identificarse y el pie del sidebar muestra un usuario ficticio. Keycloak (realm `hris`, cliente público `hris-frontend` con PKCE) ya está listo en el entorno local, así que es el momento de exigir sesión antes de construir las primeras features, que dependerán de saber quién es el usuario y de enviar su token al backend.

## What Changes

- Integrar el frontend con Keycloak mediante Authorization Code + PKCE (S256) sobre el cliente `hris-frontend`: la aplicación solo se muestra con una sesión válida; sin ella, redirige al login de Keycloak y vuelve a la URL solicitada.
- Configuración del proveedor de identidad (issuer `http://localhost:8081/realms/hris` y `clientId`) en los ficheros de entorno de Angular (`src/environments/`), con sustitución por configuración de build, en lugar de valores fijos en el código.
- Renovación automática del access token mientras la sesión está activa; si la renovación falla (sesión caducada o cerrada en Keycloak), se vuelve a pedir el login.
- Información del usuario autenticado en el shell: el marcador estático del pie del sidebar se sustituye por su avatar con iniciales, nombre y rol principal, obtenidos de los claims del token.
- Cierre de sesión desde el shell: menú del usuario con la opción "Cerrar sesión", que termina la sesión en Keycloak (logout RP-initiated) y regresa a la aplicación, que vuelve a pedir el login.
- Interceptor HTTP que añade `Authorization: Bearer <token>` solo a las peticiones dirigidas a la API propia (URL base también en los entornos), preparado para las primeras features.
- Fuera de alcance: filtrado del menú y guardas de ruta por rol (`NavItem.roles` sigue sin uso), página de login propia o tema de Keycloak, configuración del resource server en el backend y configuración en tiempo de ejecución (`config.json`) para despliegues.

## Capabilities

### New Capabilities
- `frontend-auth`: autenticación del frontend contra Keycloak — sesión obligatoria, configuración del issuer por entorno, renovación del token, cierre de sesión, perfil del usuario actual y envío del token a la API.

### Modified Capabilities
- `app-shell`: se añade el requisito de mostrar el usuario autenticado y el acceso a cerrar sesión en el shell (sustituye el marcador estático del pie del sidebar).

## Impact

- `frontend/src/app/app.config.ts` (proveedor de Keycloak, `HttpClient` con interceptor), nuevo `frontend/src/app/core/auth/` (configuración, servicio de usuario actual) y `frontend/src/environments/`.
- `frontend/src/app/layout/shell/` (pie del sidebar con menú de usuario) y sus tests, que pasan a usar un Keycloak simulado.
- `frontend/angular.json`: `fileReplacements` para la configuración `development`.
- Dependencias nuevas: `keycloak-angular` 22 y `keycloak-js` 26 (entran en el bundle inicial; presupuesto de 500 kB).
- `infra/keycloak/realm-hris.json` ya permite `http://localhost:4200/*` como redirect y post-logout redirect: no requiere cambios. Sin impacto en el backend.
