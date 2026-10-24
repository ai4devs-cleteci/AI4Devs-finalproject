# Tasks

## 1. Paleta y preset de Cleteci

- [x] 1.1 Crear `frontend/src/app/core/theme/cleteci-palette.ts` con `CLETECI_PRIMARY` y `CLETECI_SURFACE` (valores de la tabla de design.md) y `cleteci-palette.spec.ts` con la función de contraste WCAG y las parejas de la decisión 1 (texto ≥ 4,5:1, foco ≥ 3:1); verificar con `npx ng test --include src/app/core/theme/cleteci-palette.spec.ts`.
- [x] 1.2 Crear `frontend/src/app/core/theme/cleteci-preset.ts` con `definePreset(Aura, …)` que fija `semantic.primary` y `colorScheme.light/dark.surface`, y un test que comprueba que `primary.500` es `#0161ef` y que `surface.950` es `#030620` en ambos esquemas; verificar con `npx ng test --include src/app/core/theme/cleteci-preset.spec.ts`.
- [x] 1.3 Sustituir `Aura` por `CleteciPreset` en `frontend/src/app/app.config.ts`; verificar con `npm run build` (sin errores ni presupuestos nuevos superados) y con `npm test` (incluidas las auditorías AXE del shell).

## 2. Pantalla de error de arranque

- [x] 2.1 Declarar en `frontend/src/styles.css` (`@theme`) la escala `--color-cleteci-50` … `--color-cleteci-950` y añadir un test que importa `styles.css?raw` y comprueba que coincide con `CLETECI_PRIMARY`; verificar con `npx ng test --include` del nuevo spec.
- [x] 2.2 Cambiar en `frontend/src/main.ts` las clases `emerald-*` del botón "Reintentar" por `bg-cleteci-600 hover:bg-cleteci-700 focus-visible:outline-cleteci-600`, y actualizar el comentario; verificar que `grep -rn emerald frontend/src` no devuelve resultados y que el botón se ve azul con Keycloak parado (`docker compose stop keycloak`, `npm start`).

## 3. Verificación visual e integración

- [x] 3.1 Con `docker compose up -d` y `npm start`, revisar en tema claro y oscuro la navegación (entrada activa, distintivo, avatar), la barra superior, el listado, el detalle con sus diálogos y el formulario de colaboradores: primario azul de marca, superficies marinas y fondo oscuro `#030620`; anotar y corregir cualquier combinación que no alcance AA (comprobando el contraste calculado en el navegador).
- [x] 3.2 Actualizar `CLAUDE.md` (sección Frontend: preset de Cleteci en `core/theme/`, paleta en `cleteci-palette.ts` y tokens `cleteci-*` de Tailwind) y verificar que describe los ficheros reales.

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` tras la revisión.
