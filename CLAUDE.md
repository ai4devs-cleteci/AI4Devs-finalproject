# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

HRIS de Cleteci (gestión de personas). Monorepo con:

- `backend/` — Spring Boot 4.1 sobre Java 25 (Maven wrapper), paquete raíz `com.cleteci.erp`.
- `frontend/` — Angular 22 + PrimeNG 22 (tema Aura) + Tailwind CSS 4 (`tailwindcss-primeui`).
- `infra/` — configuración del entorno local: realm de Keycloak e init de PostgreSQL.
- `openspec/` — especificaciones con flujo OpenSpec (`schema: spec-driven`).

El primer módulo de dominio es el registro de colaboradores (backend `colaboradores` + catálogos de `organizacion`, frontend `/colaboradores`); el resto de entradas del menú siguen con su página provisional. La documentación, comentarios y mensajes de commit se escriben en español.

## Entorno local

```bash
cp .env.example .env
docker compose up -d
```

- PostgreSQL 16 en `localhost:5432` (BD `hris`, usuario/clave `hris`). El script `infra/postgres/init/01-keycloak-db.sh` crea además la BD `keycloak`; solo corre al inicializar el volumen por primera vez (para re-ejecutarlo: `docker compose down -v`).
- Keycloak 26.4 en `localhost:8081` (admin/admin), importa `infra/keycloak/realm-hris.json` al arrancar.

### Realm `hris` (Keycloak)

- Roles de realm: `people-talent`, `administracion`, `delivery-manager`, `direccion`, `colaborador`.
- Clientes: `hris-api` (bearer-only, lo usa el backend como resource server JWT) y `hris-frontend` (público, Authorization Code + PKCE S256, origen `http://localhost:4200`).
- Usuarios de prueba, uno por rol: `pyt@`, `admin@`, `dm@`, `direccion@`, `colaborador@cleteci.local` (credenciales en el JSON del realm).

## Backend (`backend/`)

```bash
./mvnw spring-boot:run                       # arrancar la app
./mvnw spring-boot:test-run                  # arrancar con TestCleteciErpApplication (PostgreSQL vía Testcontainers)
./mvnw test                                  # todos los tests (requiere Docker por Testcontainers)
./mvnw test -Dtest=CleteciErpApplicationTests            # una clase
./mvnw test -Dtest=CleteciErpApplicationTests#contextLoads  # un método
./mvnw package
```

Arquitectura y stack:

- **Spring Modulith**: la aplicación es un monolito modular. Cada módulo de dominio es un subpaquete directo de `com.cleteci.erp`; los demás módulos solo deben usar su API pública (paquete raíz del módulo; la implementación va en `internal`) y comunicarse preferentemente por eventos. `ModularityTests` verifica los límites. Incluye `spring-modulith-starter-jpa` (registro de publicaciones de eventos, tabla en `V1`), actuator y observabilidad de Modulith.
- Módulos actuales:
  - `plataforma` (módulo abierto, infraestructura): `SecurityConfig`, roles de realm → `ROLE_<rol>` (`RealmRolesConverter`, `HrisRoles`), CORS (`hris.cors.allowed-origins`), `GlobalExceptionHandler` con Problem Details en español (`messages.properties`), excepciones de negocio (`RecursoNoEncontradoException` 404, `ConflictoException` 409, `OperacionNoPermitidaException` 403, `DatosNoValidosException` 400), `UsuarioActual`, `Pagina`, `Clock` y auditoría JPA.
  - `organizacion`: catálogos de solo lectura (unidades, proyectos con su DM, roles, niveles con banda, trayectorias, países) vía la interfaz `Catalogos` y `GET /api/v1/catalogos/{catalogo}`.
  - `colaboradores`: CRUD en `/api/v1/colaboradores` (permisos con `@PreAuthorize` en `ColaboradorService`; el DM solo ve a su equipo). Guarda códigos de catálogo, no asociaciones JPA entre módulos.
- Persistencia: Spring Data JPA + PostgreSQL (`ddl-auto: validate`, `open-in-view: false`), esquema gestionado con **Flyway** (`src/main/resources/db/migration`). `db/local` contiene datos solo para el entorno local (proyectos de ejemplo con `dm@cleteci.local`); se incluye por defecto vía `HRIS_FLYWAY_LOCATIONS`.
- Seguridad: OAuth2 Resource Server (JWT emitidos por Keycloak, realm `hris`, audiencia `hris-api`; `preferred_username` como nombre del usuario).
- Configuración por variables de entorno con valores por defecto para el entorno local: `SPRING_DATASOURCE_URL`/`_USERNAME`/`_PASSWORD`, `HRIS_AUTH_ISSUER`, `HRIS_CORS_ALLOWED_ORIGINS`, `HRIS_FLYWAY_LOCATIONS`.
- API REST con `spring-boot-starter-webmvc`, validación con Bean Validation, documentación OpenAPI con springdoc. Cliente HTTP saliente con `RestClient`.
- Lombok está habilitado como annotation processor.
- Tests de integración con Testcontainers: la anotación `@IntegrationTest` arranca la app en puerto aleatorio con `TestcontainersConfiguration` (PostgreSQL 16) y `MockMvcTester`; `TestJwts` simula tokens con roles de realm (`pyt()`, `dm()`, `direccion()`…). Con `@Transactional` cada test deshace sus datos.

Seguir la skill `backend/.claude/skills/spring-boot-guidelines/SKILL.md`: inyección por constructor, componentes package-private, `@ConfigurationProperties` tipadas, límites transaccionales en servicios, `open-in-view` desactivado, separar DTOs web de entidades, command objects para operaciones de negocio, manejo de excepciones centralizado, Testcontainers y puerto aleatorio en tests de integración.

## Frontend (`frontend/`)

```bash
npm start                              # ng serve en http://localhost:4200
npm run build                          # build de producción
npm test                               # tests unitarios (Vitest vía @angular/build:unit-test, jsdom)
npx ng test --include src/app/app.spec.ts   # un solo archivo de test
npx prettier --write .                 # formateo (printWidth 100, comillas simples)
```

- Bootstrap standalone (`main.ts` → `app.config.ts`): router, PrimeNG con `CleteciPreset` y modo oscuro activado por la clase `.dark` (igual que la variante `dark` de Tailwind en `styles.css`).
- Shell (`src/app/layout/`): `shell/` monta el `Sidebar` compuesto de PrimeNG 22 (`primeng/sidebar`) con barra superior y `<router-outlet>`. `app.routes.ts` solo hace `loadChildren` de `shell/shell.routes.ts`, que define el shell y sus rutas hijas.
- `layout/navigation.ts` (`NAVIGATION`) es la fuente única del menú lateral y de las rutas de módulos: una feature nueva se añade ahí con `loadChildren` y sustituye la página provisional (`shared/under-construction`). Rutas desconocidas → `shared/not-found`.
- Features en `src/app/features/<feature>/` (rutas, `data/` con modelos y servicios HTTP —lecturas con `httpResource`, escrituras con `HttpClient`—, `pages/`). La primera es `colaboradores`; los errores de la API se leen con `toApiProblem` (`data/api-problem.ts`).
- Autorización en cliente: `requireRole(...roles)` (`core/auth/require-role.ts`) redirige a `/sin-acceso` (`shared/forbidden`). Es solo una ayuda: la API autoriza cada operación.
- `LayoutService` guarda el estado del layout (breakpoint de 1024 px, sidebar colapsado en `hris.sidebar.open`, tema en `hris.theme`); `index.html` aplica `.dark` antes de arrancar Angular. `AppTitleStrategy` fija `document.title` y el título de la barra superior a partir del `title` de cada ruta.
- Iconos con `@lucide/angular` (un componente por icono, `<svg lucideX>`; dinámicos con `[lucideIcon]`), no PrimeIcons. Lucide debe quedar fuera del bundle inicial: no importarlo desde `app.config.ts` ni desde código eager (esbuild lo empaqueta como un solo módulo y arrastra todos los iconos usados a `main`). Su configuración (`provideLucideConfig`) está en la ruta del shell.
- Paleta de Cleteci en `core/theme/`: `cleteci-palette.ts` es la única fuente de los colores (`CLETECI_PRIMARY`, azul de marca `#0161EF`; `CLETECI_SURFACE`, neutros marinos, los mismos en ambos temas) y `cleteci-preset.ts` deriva de Aura con ellos. En plantillas se usan `primary-*`/`surface-*`; lo que se pinta sin PrimeNG (pantalla de error de `main.ts`) usa los tokens `cleteci-*` de `styles.css`, copia de `CLETECI_PRIMARY` que un test mantiene sincronizada. Los tests de la paleta comprueban el contraste AA de las combinaciones usadas.
- Fuente base Inter (`@fontsource-variable/inter`, autoalojada) vía `--font-sans` en `styles.css`.
- Autenticación con Keycloak (`keycloak-angular` + `keycloak-js`) en `src/app/core/auth/`: `provideAuth()` (en `app.config.ts`) inicializa con `login-required` + PKCE, renueva el token y añade `Authorization: Bearer` solo a `apiUrl`. El resto de la app usa `AuthService` (`user()`, `hasRole()`, `logout()`), nunca `Keycloak` directamente. Si Keycloak no responde al arrancar, `main.ts` muestra un aviso con "Reintentar".
- Configuración por entorno en `src/environments/` (`environment.ts` por defecto, `environment.development.ts` vía `fileReplacements` en `ng serve`): `auth.issuer` (`http://localhost:8081/realms/hris`), `auth.clientId` y `apiUrl`.
- PrimeNG 22 exige licencia PrimeUI (`providePrimeNG({ license })`); sin ella muestra el aviso "Invalid PrimeUI License".
- Tests: `src/test-setup.ts` sustituye el `localStorage` que Node ≥ 22 deja indefinido en jsdom y el `ResizeObserver` que jsdom no implementa; `src/testing/match-media.ts` simula `matchMedia`. Los tests del shell ejecutan `axe-core` (sin la regla de contraste, que jsdom no calcula). Los tests que montan el shell añaden `provideFakeAuth(user?)` (`src/testing/auth.ts`, con `testUser(username, ...roles)`) en lugar de Keycloak. `src/testing/colaboradores.ts` monta la feature con HTTP simulado y datos de ejemplo. `vitest-base.config.mts` (`runnerConfig: true`) sube el `testTimeout` a 20 s por las auditorías AXE.
- Presupuestos de producción: 500 kB de aviso / 1 MB de error inicial; 4 kB / 8 kB por estilo de componente. El bundle inicial ya supera el aviso (~588 kB): el optimizador de chunks sube a `main` módulos del framework compartidos por varios chunks lazy.
- Hay un servidor MCP de Angular CLI configurado en `frontend/.vscode/mcp.json`.

Reglas obligatorias (de `frontend/AGENTS.md`, idénticas en `frontend/.claude/CLAUDE.md` y `frontend/.cursor/rules/cursor.mdc`):

- Componentes standalone sin poner `standalone: true`; `input()`/`output()` en lugar de decoradores; `host` en el decorador en vez de `@HostBinding`/`@HostListener`.
- Estado con signals y `computed()`; nunca `mutate`, usar `set`/`update`.
- **Formularios solo con Signal Forms (`@angular/forms/signals`)**; no Reactive ni Template-driven.
- Control flow nativo (`@if`, `@for`, `@switch`); bindings `class`/`style` en vez de `ngClass`/`ngStyle`.
- Servicios con `providedIn: 'root'` e `inject()` en lugar de inyección por constructor.
- Rutas de features con lazy loading; `NgOptimizedImage` para imágenes estáticas.
- Accesibilidad: debe pasar AXE y cumplir WCAG AA.
- TypeScript estricto, sin `any` (usar `unknown`).

La skill `frontend/.agents/skills/angular-developer/` tiene referencias por tema (signal forms, resource/httpResource, routing, testing, Tailwind…) y pide ejecutar `ng build` tras generar código para verificar que compila.

## OpenSpec

Los cambios se trabajan con el flujo OpenSpec: proponer → aplicar → archivar. Comandos disponibles: `/opsx:propose`, `/opsx:explore`, `/opsx:apply`, `/opsx:update`, `/opsx:sync`, `/opsx:archive` (también como skills `openspec-*`). Las especificaciones vigentes viven en `openspec/specs/` y los cambios en curso en `openspec/changes/` (los completados en `openspec/changes/archive/`).
