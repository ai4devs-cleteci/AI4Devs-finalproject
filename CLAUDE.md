# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HRIS Cleteci: an internal HR information system for about 50 employees. It covers employee records, lifecycle, time off, compensation, recruiting, skills, loans and reporting. It is an AI4Devs final project. `readme.md` (in Spanish) is the full product and architecture spec. It includes the data model (§3), user stories (§5) and tickets (§6). `prompts.md` logs the AI prompts used for each delivery. Domain language, docs and specs are in Spanish.

The hard deadline driving scope: annual time-off balances must generate automatically on **2027-01-01**.

## Current state vs. the README

The repo is an early scaffold. The README describes the target state, and several things in it **do not exist yet**:

- There is no `infra/`, no `docker-compose.yml`, no `.env.example` and no Keycloak realm. There are no `local` or `seed` Spring profiles.
- The backend package is `com.cleteci.erp` (artifact `cleteci-erp`), not `com.cleteci.hris` as the README shows.
- Module boundaries are enforced with **Spring Modulith** (`spring-modulith-starter-*` in `pom.xml`), not ArchUnit.
- Frontend unit tests use **Vitest** (via `@angular/build:unit-test`), not Jest. Playwright and an `e2e` script are not set up.

If you build any of these, follow the README's design rather than inventing a new one.

## Commands

Backend (`backend/`, Java 25, Spring Boot 4.1, Maven wrapper):

```bash
./mvnw verify                                  # build + all tests
./mvnw test -Dtest=ClassName                   # single test class
./mvnw test -Dtest=ClassName#method            # single test method
./mvnw spring-boot:test-run                    # run app with a Testcontainers Postgres (TestCleteciErpApplication)
./mvnw spring-boot:run
```

Tests and `spring-boot:test-run` need Docker, because they start PostgreSQL through Testcontainers (`TestcontainersConfiguration`).

Frontend (`frontend/`, Angular 22, PrimeNG 22 with the Aura theme, Tailwind 4 with `tailwindcss-primeui`):

```bash
npm ci
npm start                 # ng serve on :4200
npm run build
npm test                  # ng test (Vitest + jsdom)
npx ng test --include src/app/app.spec.ts   # single spec file
npx prettier --write .    # printWidth 100, singleQuote, angular parser for *.html
```

## Target architecture (from readme.md §2)

**Modular monolith with vertical slices per business context.** Top-level backend packages are `people` (M1), `recruiting` (M2), `lifecycle` (M3), `timeoff` (M4), `compensation` (M5), `skills` (M6), `finance` (M7), `reporting` (M9), plus the cross-cutting `platform` (security, calendar, export, notification, attachment, audit).

- **Organize by use case, not by layer. There is no cross-cutting `Service` layer.** Each use-case folder (for example `timeoff/request/`) is self-contained: `XxxController` (no logic), `XxxCommand` (record), `XxxHandler` (orchestration), `XxxPolicy` (a pure decision function with no data access, where most tests go), and `XxxResult` (a sealed interface of outcomes, handled with pattern matching).
- **Don't use exceptions for business-rule outcomes.** Model them as sealed result types.
- Where rules go:
  - Concept invariants go in the aggregate. Example: an employee on probation can't request time off.
  - Operation-specific rules go in the slice policy. Example: minimum notice, sufficient balance.
  - Reads and lists project straight to SQL through `JdbcClient` and never load aggregates. Writes go through JPA aggregates.
- Boundary rules that must be enforced by automated architecture tests:
  - Contexts don't import each other's internals.
  - Nothing outside `compensation`/`banking` references their entities.
  - Read projections don't depend on aggregates.
  - `platform` depends on no business context.
  - Policies have no data-access dependencies.
- Frontend `src/app/features/<context>/` mirrors the backend contexts one to one, alongside `core/` (auth, interceptors, guards) and `shared/`. TS types are meant to be generated from the backend's OpenAPI spec (springdoc), not hand-written.

### Security model (a functional requirement, not polish)

- Keycloak (OIDC) is the only identity authority. The backend is an OAuth2 resource server. **Deny by default**: an endpoint without an explicit authorization rule must be inaccessible.
- Five roles: People & Talent, Administración, Delivery Manager, Dirección, Colaborador.
- **Row-level scope is resolved in one component and applied inside the SQL query, never by filtering results afterwards.** A DM sees only employees on their projects; a Colaborador sees only themselves.
- Compensation and banking data live in **separate PostgreSQL schemas** (`compensation`, `banking`, alongside `core`) with their own DB credentials. They are never columns on the employee table. DMs never see compensation. Only Administración sees banking data, and People & Talent does not.
- Reads of compensation and banking data are audited, not just writes.
- UI role-based hiding is a convenience only. Authorization tests must hit the API directly.

### Data conventions

- Primary keys are `uuid` generated by the DB. Timestamps are always `timestamptz`.
- Temporal history uses `effective_from`/`effective_to`, where null means current, with a PostgreSQL **exclusion constraint** against overlaps. Integration tests must run on real Postgres (Testcontainers), never an in-memory DB.
- Use soft delete everywhere. Catalogs have an `active` flag. Departed employees are archived, never deleted.
- Use ISO 3166-1 alpha-2 country codes and ISO 4217 currency codes. Every operation records its actor (`recorded_by`, `approved_by`, ...).
- Use Flyway migrations. Every migration must be **backward compatible with the previous app version** because of rolling deploys. Renames and drops take two deployments.

## Frontend conventions (frontend/AGENTS.md)

- Use standalone components, and don't set `standalone: true`.
- Use signals for state and `computed()` for derived state. Use `update`/`set` on signals, never `mutate`.
- Use `input()`/`output()` instead of decorators, and `inject()` instead of constructor injection.
- Use native control flow (`@if`/`@for`/`@switch`) and reactive forms.
- Use `class`/`style` bindings instead of `ngClass`/`ngStyle`. Use the `host` object instead of `@HostBinding`/`@HostListener`.
- Lazy-load feature routes. Use `NgOptimizedImage` for static images.
- Avoid `any`. Must pass AXE checks and meet WCAG AA.

## OpenSpec workflow

Changes are planned with OpenSpec (`openspec/`, schema `spec-driven`). Use the `/opsx:*` commands or `openspec-*` skills to propose, apply, sync and archive changes. Specs live in `openspec/specs/`, active changes in `openspec/changes/`, and completed ones in `openspec/changes/archive/`.
