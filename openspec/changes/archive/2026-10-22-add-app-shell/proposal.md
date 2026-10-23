# Proposal

## Why

El frontend sigue mostrando la página placeholder que genera Angular CLI y no tiene rutas. Antes de construir la primera feature (registro del colaborador, descansos…) hace falta un shell común —navegación lateral, barra superior y área de contenido— donde cada módulo se monte como ruta lazy, para no rehacer el layout feature a feature.

## What Changes

- Sustituir el placeholder de `app.html` por un shell de aplicación construido con el componente compuesto `Sidebar` de PrimeNG 22 (`p-sidebar-layout`, `p-sidebar`, `p-sidebar-main`, `pSidebarTrigger`, `pSidebarRail`).
- Navegación lateral con los módulos funcionales del HRIS agrupados por área (Personas, Gestión, Análisis), con icono y etiqueta, resaltando la entrada de la ruta activa.
- Sidebar colapsable a modo icono en escritorio y en modo overlay con backdrop en pantallas estrechas; el estado de colapso se recuerda entre visitas.
- Barra superior con el botón de colapso, el título de la sección activa y un conmutador de tema claro/oscuro (clase `.dark` ya configurada en PrimeNG y Tailwind).
- Iconografía de la aplicación con **Lucide** (`@lucide/angular`) en lugar de PrimeIcons, tanto en la navegación como en la barra superior.
- Tipografía base **Inter** (variable, autoalojada) para toda la interfaz, incluidos los componentes PrimeNG.
- Rutas lazy de los módulos que apuntan a una página placeholder común ("en construcción") y página 404 dentro del shell; `''` redirige a la página de inicio.
- Fuera de alcance: autenticación con Keycloak, filtrado del menú por rol y datos del usuario real (se abordarán en el cambio de autenticación del frontend). El pie del sidebar reserva el hueco para el usuario con un marcador estático.

## Capabilities

### New Capabilities
- `app-shell`: estructura de navegación del frontend — layout con sidebar, barra superior, catálogo de entradas de menú, comportamiento responsive/colapso, tema y rutas de módulos dentro del shell.

### Modified Capabilities
<!-- Ninguna: no existen especificaciones previas. -->

## Impact

- `frontend/src/app/`: `app.ts`, `app.html`, `app.css`, `app.routes.ts`, `app.spec.ts`; nuevos `layout/` (shell, navegación) y `features/` / `shared/` (páginas placeholder y 404).
- `frontend/src/styles.css` (fuente base) y `frontend/src/index.html`.
- Dependencias nuevas: `@lucide/angular` y `@fontsource-variable/inter`. `@primeicons/angular` sigue llegando como dependencia interna de `primeng` (iconos propios de sus componentes), pero el código de la aplicación no lo usa.
- Sin impacto en backend ni infraestructura.
