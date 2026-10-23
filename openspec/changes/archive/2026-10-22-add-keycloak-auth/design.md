# Design

## Context

- `frontend/` arranca con `bootstrapApplication(App, appConfig)`; `app.config.ts` registra router, `AppTitleStrategy` y PrimeNG. No hay `HttpClient`, ni `src/environments/`, ni `fileReplacements` en `angular.json` (configuraciones `production` por defecto y `development` para `ng serve`).
- El shell (`layout/shell/`) es una ruta lazy (`loadChildren` de `shell.routes.ts`) para mantener Lucide fuera del bundle inicial. Su pie (`p-sidebar-footer`) contiene un marcador estático "Usuario" con el comentario de que se sustituirá al integrar Keycloak.
- Los tests del shell y de rutas (`shell.spec.ts`, `app.routes.spec.ts`) montan `provideRouter(routes)` sin `appConfig`, así que no arrancan ningún proveedor de autenticación: habrá que darles un usuario simulado.
- Realm `hris` (`infra/keycloak/realm-hris.json`): cliente público `hris-frontend`, PKCE S256 obligatorio, redirect y post-logout redirect `http://localhost:4200/*`, mapper de audiencia `hris-api` en el access token, `accessTokenLifespan` de 900 s. Los usuarios de prueba tienen `firstName`/`lastName`/`email` y un rol de realm cada uno.
- Versiones disponibles compatibles con Angular 22.2: `keycloak-angular` 22.0.0 (peer `keycloak-js` ^18–^26) y `keycloak-js` 26.2.x.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de configuración del proveedor (el issuer), la misma URL que usará el backend como `issuer-uri`.
- Encapsular Keycloak tras un servicio propio para que el shell y las features dependan del perfil de usuario, no de `keycloak-js`, y se puedan testear sin red.

**Non-Goals:**
- Autorización por rol en rutas o menú (se apoyará en `AuthService.hasRole` en un cambio posterior).
- Login silencioso con iframe (`check-sso`), páginas públicas o modo anónimo.
- Configuración en tiempo de ejecución (`config.json`) para promover el mismo build entre entornos.

## Decisions

### 1. `keycloak-angular` 22 + `keycloak-js` 26
`provideKeycloak({ config, initOptions, features, providers })` inicializa con `provideAppInitializer`, publica los eventos como signal (`KEYCLOAK_EVENT_SIGNAL`), trae `withAutoRefreshToken` e `includeBearerTokenInterceptor` con condiciones por URL. *Alternativas:* `angular-oauth2-oidc` o `angular-auth-oidc-client` (OIDC genérico) — válidos, pero obligan a reimplementar el refresco ligado a la actividad y la lectura de roles de Keycloak; `keycloak-js` a pelo — habría que escribir el inicializador, las signals y el interceptor que ya da la librería.

### 2. Configuración por entorno con `fileReplacements`
Se generan `src/environments/environment.ts` (por defecto/producción) y `environment.development.ts` (sustituye al anterior en la configuración `development` de `angular.json`, como hace `ng generate environments`):
```ts
export const environment = {
  auth: { issuer: 'http://localhost:8081/realms/hris', clientId: 'hris-frontend' },
  apiUrl: 'http://localhost:8080/api',
};
```
`core/auth/auth.config.ts` traduce el issuer a la config de `keycloak-js` (`{ url, realm, clientId }`) partiéndolo por `/realms/`, y lanza un error descriptivo si no tiene esa forma. Se guarda el issuer y no `url`+`realm` porque es el valor estándar OIDC que comparten frontend y backend. *Alternativa:* opción `oidcProvider` de `keycloak-js` — descartada porque desactiva comportamientos específicos de Keycloak (endpoints de cuenta, logout) de los que no queremos depender en modo genérico.

### 3. Sesión obligatoria al arrancar (`login-required`)
`initOptions`: `onLoad: 'login-required'`, `pkceMethod: 'S256'`, `checkLoginIframe: false` (los navegadores bloquean las cookies de terceros que necesita el iframe y no aporta con renovación por refresh token). Angular no renderiza nada hasta que el inicializador resuelve, así que nunca se ve el shell sin sesión; `keycloak-js` usa la URL actual como `redirectUri`, con lo que se vuelve a la ruta solicitada y limpia los parámetros del código. *Alternativa:* `check-sso` + `CanActivate` con `createAuthGuard` — más flexible para páginas públicas, que hoy no existen; añadiría `silent-check-sso.html` y un estado "sin sesión" que el shell tendría que gestionar.

La inicialización la hace un `provideAppInitializer` propio y no los `initOptions` de `provideKeycloak`, porque este captura y solo registra en consola los errores de `keycloak.init` (la app arrancaría sin sesión); por eso `withAutoRefreshToken(...).configure()` también se invoca desde ese inicializador. Además, con `login-required` y configuración por URL, `keycloak-js` redirige al login sin contactar antes con Keycloak: si está caído, el usuario acabaría en la página de error del navegador. El inicializador consulta primero `<issuer>/.well-known/openid-configuration` (Keycloak lo sirve con CORS para cualquier origen).

Si esa consulta o `keycloak.init` fallan (Keycloak caído, issuer mal configurado), `bootstrapApplication` rechaza: `main.ts` sustituye el `console.error` por pintar en `<body>` un mensaje en español ("No se pudo iniciar sesión…" con botón "Reintentar" que recarga), sin depender de Angular ni PrimeNG.

### 4. Renovación del token
`withAutoRefreshToken({ onInactivityTimeout: 'none' })` con `AutoRefreshTokenService` y `UserActivityService`: renueva al recibir `TokenExpired` mientras hay actividad. Además, `includeBearerTokenInterceptor` llama a `updateToken` antes de cada petición, cubriendo el caso de inactividad. La caducidad real de la sesión la decide Keycloak (SSO idle/max del realm), no un temporizador del frontend. Un `effect` en `AuthService` escucha `AuthRefreshError` en `KEYCLOAK_EVENT_SIGNAL` y llama a `keycloak.login()`. *Alternativa:* `onInactivityTimeout: 'logout'` — duplicaría en el cliente una política de sesión que ya vive en el realm.

### 5. `AuthService` y modelo `CurrentUser`
`core/auth/auth.service.ts` (`providedIn: 'root'`) es la única pieza que inyecta `Keycloak`:
- `user: Signal<CurrentUser | null>` — `computed` sobre `KEYCLOAK_EVENT_SIGNAL` que lee `tokenParsed`: `{ id: sub, username: preferred_username, name: name ?? preferred_username, email, roles }`.
- `roles` = `realm_access.roles` filtrados a `HRIS_ROLES` (`people-talent`, `administracion`, `delivery-manager`, `direccion`, `colaborador`), que vive en `core/auth/roles.ts` junto a sus etiquetas en español y el orden de prioridad para el rol principal (`direccion` › `people-talent` › `administracion` › `delivery-manager` › `colaborador`).
- `hasRole(role)`, `logout()` → `keycloak.logout({ redirectUri: window.location.origin + '/' })` (logout RP-initiated; tras volver, `login-required` pide de nuevo credenciales).

Se usan los claims del token en lugar de `loadUserProfile()` para no hacer una llamada extra a la Account API ni depender de su CORS. El token vive solo en memoria (comportamiento de `keycloak-js`), nunca en `localStorage`.

### 6. Token en peticiones a la API
`provideHttpClient(withInterceptors([includeBearerTokenInterceptor]))` y `INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG` con una condición `urlPattern` construida desde `environment.apiUrl` (prefijo escapado). Así ninguna petición a terceros recibe el token.

### 7. Ubicación: `core/auth/` y registro eager
```
src/app/core/auth/
├── auth.config.ts      # issuer → KeycloakConfig, initOptions, provideAuth()
├── auth.service.ts     # user, hasRole, logout, reacción a AuthRefreshError
├── roles.ts            # HRIS_ROLES, etiquetas y prioridad
└── *.spec.ts
src/environments/environment.ts | environment.development.ts
src/testing/auth.ts     # provideFakeAuth(user) para tests
```
`provideAuth()` agrupa `provideKeycloak`, `provideHttpClient` y la config del interceptor, y se llama desde `app.config.ts`: la autenticación tiene que resolverse antes del primer render, así que `keycloak-js` va en el bundle inicial (~35 kB con `keycloak-angular`). Junto con las partes de `@angular/router`/`common` que arrastra el `Menu` del pie (esbuild no reparte un mismo módulo entre `main` y un chunk lazy), el inicial pasa de ~500 kB a ~540 kB: supera el aviso de 500 kB, lejos del error de 1 MB. `core/auth` no importa Lucide ni PrimeNG.

### 8. Usuario y menú en el pie del sidebar
El marcador se sustituye por un `p-sidebar-menu` con un único `<button pSidebarMenuButton>` (el Sidebar ya oculta el texto en modo icono y mantiene el estilo de las entradas):
- Avatar circular con iniciales (primeras letras de las dos primeras palabras del nombre, `aria-hidden`), nombre y etiqueta del rol principal en dos líneas truncadas.
- `pTooltip` con el nombre, deshabilitado salvo en escritorio colapsado (mismo `showTooltips()` que el menú).
- Abre un `p-menu` en modo `popup` (`appendTo="body"`) con cabecera (nombre y correo) y la entrada "Cerrar sesión" con `LucideLogOut`. El botón publica `aria-haspopup="menu"`, `aria-controls` y `aria-expanded` ligados al estado del menú (eventos `onShow`/`onHide`).
- El cálculo de iniciales y etiqueta de rol vive en un `computed` del shell a partir de `AuthService.user()`; si no hay rol del HRIS, no se muestra la segunda línea.
*Alternativa:* menú en la barra superior — el pie ya reservaba el hueco y en móvil la barra superior está más cargada.

### 9. Tests sin Keycloak real
`src/testing/auth.ts` expone `provideFakeAuth(user?)`, que proporciona un `AuthService` simulado (signal de usuario y `logout` espía). `shell.spec.ts` y `app.routes.spec.ts` lo añaden a sus providers. `auth.service.spec.ts` prueba el servicio real con un objeto `Keycloak` falso (`tokenParsed`, `logout`, `login`) y una signal de eventos controlada, sin red. El AXE del shell se amplía al menú abierto.

## Risks / Trade-offs

- [El bundle inicial (~541 kB) supera el aviso de 500 kB] → Se acepta el aviso y se mantiene el presupuesto; se revisará si sigue creciendo (p. ej., cargando el tema Aura o el `Menu` de otra forma).
- [Sin backend todavía, `apiUrl` no se ejercita de extremo a extremo] → El interceptor se prueba con `HttpTestingController`; la verificación real queda para la primera feature con API.
- [El build de producción usa valores locales en `environment.ts`] → Aceptable mientras no haya despliegue; los valores reales se fijan cuando exista el entorno (ver Open Questions).
- [`login-required` deja la app en blanco mientras redirige] → Es una redirección inmediata; el fallo de Keycloak se cubre con el mensaje de error de `main.ts`.
- [Logout desde otra pestaña no se detecta sin el iframe de sesión] → La siguiente renovación falla y lleva al login (Decisión 4).
- [Cambios de API en `keycloak-angular` entre mayores] → Versiones fijadas con `^22`/`^26` y uso limitado a `provideKeycloak`, `withAutoRefreshToken`, el interceptor y `KEYCLOAK_EVENT_SIGNAL`, todo encapsulado en `core/auth`.

## Migration Plan

Sin datos que migrar. Tras desplegar, cualquier sesión del frontend pasa a requerir login. Rollback: revertir el commit (el shell vuelve al marcador estático).

## Open Questions

- Issuer, `clientId` y `apiUrl` de los entornos desplegados (AWS): se rellenarán en `environment.ts` (o se pasará a `config.json`) cuando exista la infraestructura; no cambia la forma de la configuración.
