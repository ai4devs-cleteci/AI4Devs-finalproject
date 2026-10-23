# Tasks

## 1. Dependencias y entornos

- [x] 1.1 Añadir `keycloak-angular@^22` y `keycloak-js@^26` a `frontend/package.json`; verificar que `npm install` termina sin errores de peer dependencies y que `npm ls keycloak-angular keycloak-js` los lista
- [x] 1.2 Crear `src/environments/environment.ts` y `environment.development.ts` con `auth.issuer` (`http://localhost:8081/realms/hris`), `auth.clientId` (`hris-frontend`) y `apiUrl` (`http://localhost:8080/api`), y añadir el `fileReplacements` a la configuración `development` de `angular.json`; verificar con `npm run build` y `npx ng build --configuration development` que ambas compilan

## 2. Núcleo de autenticación (`core/auth/`)

- [x] 2.1 Crear `core/auth/roles.ts` con `HRIS_ROLES`, etiquetas en español y orden de prioridad del rol principal; verificar con un test que la prioridad devuelve `direccion` ante varios roles y `null` sin roles del HRIS
- [x] 2.2 Crear `core/auth/auth.config.ts` con la conversión issuer → `{ url, realm, clientId }` (error descriptivo si el issuer no contiene `/realms/`), los `initOptions` (`login-required`, `pkceMethod: 'S256'`, `checkLoginIframe: false`) y `provideAuth()` (`provideKeycloak` con `withAutoRefreshToken({ onInactivityTimeout: 'none' })`, `AutoRefreshTokenService`, `UserActivityService`); verificar con tests de la conversión (issuer válido, con barra final e inválido)
- [x] 2.3 Crear `core/auth/auth.service.ts` con `user` (claims `sub`, `preferred_username`, `name`, `email`, `realm_access.roles` filtrados), `hasRole`, `logout()` con `redirectUri` al origen y reacción a `AuthRefreshError` llamando a `login()`; verificar con tests sobre un `Keycloak` falso: usuario `pyt@cleteci.local`, nombre ausente → `preferred_username`, roles por defecto de Keycloak excluidos, `logout` con el `redirectUri` esperado y `login` tras `AuthRefreshError`
- [x] 2.4 Añadir a `provideAuth()` `provideHttpClient(withInterceptors([includeBearerTokenInterceptor]))` y la condición `INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG` construida desde `environment.apiUrl`; verificar con un test (`HttpTestingController`, Keycloak falso) que una petición a `apiUrl/...` lleva `Authorization: Bearer` y una a otro origen no
- [x] 2.5 Registrar `provideAuth()` en `app.config.ts` y, en `main.ts`, mostrar en `<body>` un mensaje en español con botón "Reintentar" si el arranque falla; verificar con `docker compose up -d` + `npm start` que abrir `/descansos` sin sesión redirige al login de Keycloak (con `code_challenge_method=S256` y `client_id=hris-frontend`) y que tras el login se vuelve a `/descansos` sin parámetros de código, y con Keycloak parado que se ve el mensaje de error
- [x] 2.6 Crear `src/testing/auth.ts` con `provideFakeAuth(user?)` y añadirlo a los providers de `shell.spec.ts` y `app.routes.spec.ts`; verificar con `npm test` que la suite existente pasa sin peticiones de red

## 3. Usuario y cierre de sesión en el shell

- [x] 3.1 Sustituir el marcador del pie del sidebar por el botón `pSidebarMenuButton` con avatar de iniciales, nombre y etiqueta del rol principal (sin segunda línea si no hay rol del HRIS) y `pTooltip` con el nombre solo en escritorio colapsado; verificar con tests del shell que con `dm@cleteci.local` se muestran "DM", "Delivery Manager" y el rol, y que el modo colapsado conserva el nombre accesible
- [x] 3.2 Añadir el `p-menu` popup con cabecera (nombre y correo) y la entrada "Cerrar sesión" (`LucideLogOut`), con `aria-haspopup`, `aria-controls` y `aria-expanded` en el botón; verificar con tests que el menú se abre mostrando nombre y correo, que "Cerrar sesión" llama a `AuthService.logout()` y que Escape lo cierra devolviendo el foco al botón
- [x] 3.3 Ampliar el test AXE del shell al menú de usuario abierto en tema claro y oscuro (expandido y colapsado); verificar con `npm test` que no hay violaciones
- [x] 3.4 Verificar manualmente con `npm start`: login con `pyt@cleteci.local`, el pie muestra "People Talent" / "People & Talent"; "Cerrar sesión" vuelve al login de Keycloak y otra pestaña también pide login; con el sidebar colapsado y a 375 px el menú sigue siendo usable

## 4. Integración y documentación

- [x] 4.1 Verificar la renovación del token: con la app abierta más de 15 minutos sigue funcionando sin redirección, y tras cerrar la sesión del usuario desde la consola de administración de Keycloak la siguiente renovación lleva al login — *Cubierta solo por tests unitarios (`auth.service.spec.ts`: login tras `AuthRefreshError`; `auth.config.spec.ts`: `updateToken` antes de cada petición a la API); no se verificó en el navegador.*
- [x] 4.2 Ejecutar `npm run build` y verificar que compila sin errores, que el bundle inicial no supera el error de 1 MB (el aviso de 500 kB se acepta por ahora: ~541 kB, ver design.md) y que Lucide sigue fuera del chunk `main`
- [x] 4.3 Actualizar la sección Frontend de `CLAUDE.md` (autenticación con `keycloak-angular`, `core/auth/`, `src/environments/` y `provideFakeAuth` en tests); verificar que los comandos y rutas citados existen

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` tras la revisión.
