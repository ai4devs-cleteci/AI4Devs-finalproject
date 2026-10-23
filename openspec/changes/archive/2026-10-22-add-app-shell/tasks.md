# Tasks

## 1. Preparación

- [x] 1.1 Añadir `@lucide/angular` y `@fontsource-variable/inter` como dependencias y `axe-core` como devDependency en `frontend/package.json`; verificar que `npm install` termina sin errores y que `npm ls @lucide/angular @fontsource-variable/inter axe-core` los lista
- [x] 1.2 En `frontend/src/index.html`: `lang="es"`, título "HRIS Cleteci" y script inline que aplica `.dark` a `<html>` según `localStorage['hris.theme']` o `prefers-color-scheme` (con `try/catch`); verificar abriendo la app con el sistema en oscuro que no hay parpadeo claro
- [x] 1.3 Eliminar el placeholder de Angular CLI de `app.html`/`app.css`, dejar `App` con solo `<router-outlet />` y actualizar `app.spec.ts` (quitar el test de "Hello, frontend"); verificar con `npm test`
- [x] 1.4 Configurar Inter como fuente base: `@import '@fontsource-variable/inter';` y `@theme { --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif; }` en `styles.css`; verificar en DevTools (pestaña Fonts / computed `font-family`) que el texto de un componente PrimeNG y del `body` se renderiza con Inter y que la pestaña Network no muestra peticiones a dominios externos de fuentes
- [x] 1.5 Registrar `provideLucideConfig({ size: 20, strokeWidth: 2 })` (en los providers de la ruta del shell, no en `app.config.ts`, para mantener Lucide fuera del bundle inicial); verificar con `npm run build` que compila

## 2. Estado de layout y tema

- [x] 2.1 Crear `layout/layout.service.ts` (`providedIn: 'root'`) con signals `isDesktop` (vía `matchMedia('(min-width: 1024px)')`, escritorio si no existe), `desktopSidebarOpen` y `darkMode`, persistidos en `hris.sidebar.open` / `hris.theme` con `try/catch` y aplicando `.dark` en `<html>`; verificar con tests unitarios que cubren valor por defecto, valor guardado, almacenamiento que lanza excepción y cambio de breakpoint (matchMedia mockeado)
- [x] 2.2 Crear `layout/theme-toggle/theme-toggle.ts` (botón PrimeNG con `LucideSun`/`LucideMoon` proyectados, `aria-label` y `aria-pressed`); verificar con un test que al pulsarlo cambia `darkMode` y la clase `.dark` del documento

## 3. Catálogo de navegación y rutas

- [x] 3.1 Crear `layout/navigation.ts` con los tipos `NavGroup`/`NavItem` (incluido `roles?` sin uso) y `NAVIGATION` con los tres grupos y nueve entradas, paths e iconos Lucide (`LucideIcon`) definidos en design.md; verificar con un test que no hay paths duplicados y que hay 3 grupos / 9 entradas en el orden del spec
- [x] 3.2 Crear `shared/under-construction/` (muestra "<módulo> está en construcción" leyendo el título de la ruta) y `shared/not-found/` (404 con enlace a `/inicio`); verificar con tests de componente
- [x] 3.3 Crear una `TitleStrategy` propia (`"<título> · HRIS Cleteci"` + signal con el título actual) y registrarla en `app.config.ts`; verificar con un test de router que `document.title` y la signal cambian al navegar
- [x] 3.4 Reescribir `app.routes.ts` con una ruta sin path que hace `loadChildren` de `layout/shell/shell.routes.ts` (shell como componente padre, children generados desde `NAVIGATION` (lazy al placeholder, `title`), redirección `'' → inicio` y `**` → 404 dentro del shell; verificar con tests de router (`RouterTestingHarness`) para `/`, `/prestamos` y `/no-existe`

## 4. Shell con Sidebar de PrimeNG

- [x] 4.1 Crear `layout/shell/` con `p-sidebar-layout` › `p-sidebar` (cabecera "HRIS Cleteci", grupos/menú desde `NAVIGATION`, pie con usuario marcador) + `p-sidebar-main` (topbar y `<main id="contenido" tabindex="-1"><router-outlet/></main>`); verificar con `npm start` que todas las entradas navegan sin recargar
- [x] 4.2 Enlazar el modo del sidebar a `LayoutService`: escritorio `collapsible="icon"` sin overlay y `open` persistido; móvil `collapsible="offcanvas"`, `overlay`, `dismissable`, `hideOnOutsideClick`, cerrado por defecto y cerrado en `NavigationEnd`; verificar con tests del shell (matchMedia mockeado) y manualmente a 375 px y 1280 px, incluido Escape
- [x] 4.3 Entrada activa con `routerLinkActive` + `[isActive]` + `ariaCurrentWhenActive="page"`, y `pTooltip` a la derecha deshabilitado salvo en escritorio colapsado; verificar con un test que en `/colaboradores/00042` solo "Colaboradores" tiene `aria-current="page"`
- [x] 4.4 Topbar: `pSidebarTrigger` con `aria-label="Mostrar u ocultar navegación"` (y `aria-expanded` del trigger), título desde la signal de la `TitleStrategy` y `ThemeToggle`; verificar con un test que el título muestra "Reportes" en `/reportes`
- [x] 4.5 Accesibilidad: `nav` con `aria-label="Navegación principal"`, enlace "Saltar al contenido" como primer foco que enfoca `#contenido`, iconos Lucide decorativos con `aria-hidden="true"`, etiquetas en español en rail/trigger (vía `pt` o sin rail); verificar con un test que ejecuta `axe-core` sobre el shell renderizado (expandido y colapsado, claro y oscuro) sin violaciones
- [x] 4.6 Ejecutar `npm run build` y verificar que compila sin errores y respeta los presupuestos (500 kB inicial / 4 kB por estilo de componente)

## 5. Verificación integrada

- [x] 5.1 Recorrido manual en el navegador (escritorio y 375 px, ambos temas): colapsar y recargar conserva el estado, cambio de tema persiste, 404 y redirección raíz funcionan, navegación completa por teclado con foco visible y contraste AA comprobado con las DevTools
- [x] 5.2 Actualizar la sección Frontend de `CLAUDE.md` (estructura `layout/`/`shared/`, catálogo `NAVIGATION` como fuente del menú y de las rutas, iconos con `@lucide/angular` y fuente Inter); verificar que la descripción coincide con los ficheros creados

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` tras la revisión.
