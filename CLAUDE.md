# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

HRIS de Cleteci (gestión de personas). Monorepo con:

- `backend/` — Spring Boot 4.1 sobre Java 25 (Maven wrapper), paquete raíz `com.cleteci.erp`.
- `frontend/` — Angular 22 + PrimeNG 22 (tema Aura) + Tailwind CSS 4 (`tailwindcss-primeui`).
- `infra/` — configuración del entorno local: realm de Keycloak e init de PostgreSQL.
- `openspec/` — especificaciones con flujo OpenSpec (`schema: spec-driven`).

El proyecto está en fase de scaffold: aún no hay módulos de dominio, rutas ni migraciones. La documentación, comentarios y mensajes de commit se escriben en español.

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

- **Spring Modulith**: la aplicación es un monolito modular. Cada módulo de dominio es un subpaquete directo de `com.cleteci.erp`; los demás módulos solo deben usar su API pública (paquete raíz del módulo) y comunicarse preferentemente por eventos. Incluye `spring-modulith-starter-jpa` (registro de publicaciones de eventos), actuator y observabilidad de Modulith.
- Persistencia: Spring Data JPA + PostgreSQL, esquema gestionado con **Flyway** (`src/main/resources/db/migration`).
- Seguridad: OAuth2 Resource Server (JWT emitidos por Keycloak, realm `hris`).
- API REST con `spring-boot-starter-webmvc`, validación con Bean Validation, documentación OpenAPI con springdoc. Cliente HTTP saliente con `RestClient`.
- Lombok está habilitado como annotation processor.
- Tests de integración con Testcontainers (`TestcontainersConfiguration` aporta un PostgreSQL con `@ServiceConnection`; importarla con `@Import`).
- `application.yaml` solo define el nombre de la app; la configuración de datasource/issuer está pendiente.

Seguir la skill `backend/.claude/skills/spring-boot-guidelines/SKILL.md`: inyección por constructor, componentes package-private, `@ConfigurationProperties` tipadas, límites transaccionales en servicios, `open-in-view` desactivado, separar DTOs web de entidades, command objects para operaciones de negocio, manejo de excepciones centralizado, Testcontainers y puerto aleatorio en tests de integración.

## Frontend (`frontend/`)

```bash
npm start                              # ng serve en http://localhost:4200
npm run build                          # build de producción
npm test                               # tests unitarios (Vitest vía @angular/build:unit-test, jsdom)
npx ng test --include src/app/app.spec.ts   # un solo archivo de test
npx prettier --write .                 # formateo (printWidth 100, comillas simples)
```

- Bootstrap standalone (`main.ts` → `app.config.ts`): router, PrimeNG con preset Aura y modo oscuro activado por la clase `.dark` (igual que la variante `dark` de Tailwind en `styles.css`).
- Presupuestos de producción: 500 kB de aviso / 1 MB de error inicial; 4 kB / 8 kB por estilo de componente.
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
