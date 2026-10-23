# Design

## Context

- `frontend/` es el scaffold de Angular 22: `app.html` contiene el placeholder de Angular CLI, `app.routes.ts` está vacío y no hay carpetas `layout/`, `features/` ni `shared/`.
- `app.config.ts` ya registra PrimeNG con Aura y `darkModeSelector: '.dark'`; `styles.css` declara la variante `dark` de Tailwind sobre la misma clase. No hay que tocar la configuración del tema, solo poner/quitar `.dark` en `<html>`.
- PrimeNG 22.1 incluye un `Sidebar` **compuesto** (`primeng/sidebar`), distinto del antiguo alias de `Drawer`: `p-sidebar-layout` › `p-sidebar` (+ `p-sidebar-header`/`content`/`footer`/`group`/`menu`/`menu-item`, `[pSidebarMenuButton]`, `[pSidebarRail]`) y `p-sidebar-main`, con `[pSidebarTrigger]` para alternar. `p-sidebar` expone `open` (model), `collapsible: 'icon' | 'offcanvas' | 'none'`, `overlay`, `dismissable`, `hideOnOutsideClick`, `width`, `iconWidth`, `id`, y cierra con Escape. `[pSidebarMenuButton]` acepta `isActive`. El trigger ya publica `aria-controls`/`aria-expanded`.
- El componente **no** gestiona breakpoints ni persistencia: lo hace el shell.
- Iconos: `@primeicons/angular` 8 llega como dependencia de `primeng`, que lo usa internamente en sus componentes (chevrons, cerrar, etc.). La aplicación usará Lucide (`@lucide/angular` 1.x, standalone y basado en signals; el paquete antiguo `lucide-angular` no admite Angular 22).
- Tipografía: no hay fuente configurada; Tailwind 4 aplica `--font-sans` (pila del sistema) a `html` y los componentes Aura heredan `font-family`.
- Reglas del frontend (`frontend/AGENTS.md`): standalone sin `standalone: true`, signals, `inject()`, `host` en el decorador, control flow nativo, rutas lazy, AXE/WCAG AA, sin `any`.

## Goals / Non-Goals

**Goals:**
- Un único componente de layout reutilizado por todas las rutas, con el catálogo de navegación declarado como datos (no hardcodeado en la plantilla).
- Comportamiento responsive (iconos en escritorio, overlay en móvil) y persistencia de preferencias sin dependencias adicionales.

**Non-Goals:**
- Integración con Keycloak, guardas de ruta, filtrado del menú por rol (el modelo de datos deja el campo preparado, pero no se usa).
- Submenús anidados, badges con contadores o búsqueda en el menú.
- Contenido real de los módulos o de la página de Inicio.

## Decisions

### 1. `Sidebar` compuesto de PrimeNG 22 en lugar de `Drawer` o `PanelMenu`
Proporciona el layout completo (empuje del contenido, modo icono, rail, backdrop, trigger accesible) con tokens del tema Aura y soporte de `.dark`. *Alternativas:* `Drawer` solo cubre el overlay y obligaría a maquetar a mano el modo fijo/colapsado; `PanelMenu`/`Menu` dentro de un `aside` propio duplica lo que el `Sidebar` ya resuelve.

### 2. Estructura de ficheros
```
src/app/
├── layout/
│   ├── shell/shell.ts|html|css        # p-sidebar-layout + topbar + <router-outlet>
│   ├── shell/shell.routes.ts          # Shell + rutas hijas (cargado con loadChildren)
│   ├── navigation.ts                  # NavGroup/NavItem + NAVIGATION (catálogo)
│   ├── layout.service.ts              # isDesktop, sidebarOpen, darkMode (signals + persistencia)
│   └── theme-toggle/theme-toggle.ts
├── shared/
│   ├── under-construction/            # página "en construcción" (lee el título de la ruta)
│   └── not-found/                     # 404
└── app.routes.ts                      # ruta raíz: loadChildren de shell.routes
```
`App` queda como `<router-outlet />`; el shell es una ruta padre sin path, de modo que una futura pantalla de login/error pueda vivir fuera del shell. Se adelanta `layout/` (equivalente al `core/` del readme de la entrega 1) para no mezclar shell con auth.

### 3. Catálogo de navegación como datos tipados
`NAVIGATION: readonly NavGroup[]` con `{ label, items: { label, path, icon: LucideIcon, roles?: readonly string[] }[] }`. La plantilla itera con `@for` y pinta el icono con el componente dinámico `<svg [lucideIcon]="item.icon">` (`LucideDynamicIcon`), sin `NgComponentOutlet`. Las rutas hijas se generan desde el mismo catálogo en `shell.routes.ts` (`loadComponent` del placeholder + `title`), garantizando que menú y rutas no diverjan. `app.routes.ts` solo hace `loadChildren` de ese fichero, de modo que el catálogo y sus iconos no entran en el bundle inicial. Paths en español, alineados con la UI: `inicio`, `colaboradores`, `descansos`, `ciclo-de-vida`, `seleccion`, `compensacion`, `skills`, `prestamos`, `reportes`. `roles` queda opcional y sin uso hasta el cambio de autenticación.

### 4. Entrada activa con `routerLinkActive`
Cada `<a pSidebarMenuButton [routerLink]>` usa `routerLinkActive` con `#rla="routerLinkActive"`, `[isActive]="rla.isActive"` y `ariaCurrentWhenActive="page"`. Coincidencia por prefijo (por defecto) para que las subrutas mantengan el resaltado; `inicio` también usa prefijo porque no tiene subrutas que colisionen.

### 5. Responsive con `matchMedia` en `LayoutService`
`isDesktop = signal(matchMedia('(min-width: 1024px)').matches)` actualizada por el listener `change` (registrado con `DestroyRef`). El shell enlaza:
- escritorio: `collapsible="icon"`, `[overlay]="false"`, `[(open)]` ligado a `desktopOpen` persistido;
- móvil: `collapsible="offcanvas"`, `[overlay]="true"`, `dismissable`, `hideOnOutsideClick`, `open` arranca en `false` y no se persiste.
Al navegar (`NavigationEnd`) en móvil se fuerza `open=false`. *Alternativa:* `BreakpointObserver` de `@angular/cdk` — descartado para no añadir CDK solo por esto. El breakpoint 1024 px coincide con `lg` de Tailwind.

### 6. Persistencia en `localStorage` con fallback seguro
Claves `hris.sidebar.open` y `hris.theme` (`'light' | 'dark'`). Lectura/escritura envueltas en `try/catch`; un `effect()` en el servicio escribe al cambiar. Sin valor: sidebar expandido; tema según `prefers-color-scheme`. Para evitar el parpadeo de tema, un script inline mínimo en `index.html` aplica `.dark` a `<html>` antes de que arranque Angular, con la misma lógica.

### 7. Barra superior y título de sección
Topbar dentro de `p-sidebar-main`: botón `pSidebarTrigger` (`p-button` text con `<svg lucidePanelLeft>` proyectado, `aria-label="Mostrar u ocultar navegación"`), título de sección y `ThemeToggle` a la derecha. El título se obtiene con una `TitleStrategy` propia que fija `document.title` como `"<título> · HRIS Cleteci"` y expone el título actual como signal que lee la topbar. *Alternativa:* leer `ActivatedRoute` en el shell — más acoplado y no actualiza `document.title`.

### 8. Tooltips en modo colapsado
`pTooltip` (posición `right`) en cada botón del menú, deshabilitado (`[tooltipDisabled]`) cuando el sidebar está expandido o en móvil. La etiqueta se mantiene en el DOM (oculta visualmente por el propio Sidebar en modo icono), así el nombre accesible no depende del tooltip.

### 9. Accesibilidad
- `p-sidebar` dentro de un `<nav aria-label="Navegación principal">` (o atributo vía `pt` si el host no lo permite) y contenido en `<main id="contenido" tabindex="-1">`.
- Enlace "Saltar al contenido" (`sr-only focus:not-sr-only`) como primer hijo del shell.
- Iconos decorativos con `aria-hidden="true"`.
- El rail (`pSidebarRail`) trae `aria-label` en inglés ("Toggle Sidebar") y `tabindex="-1"`: se omite y se deja solo el trigger.
- En móvil, al abrir el overlay el foco pasa a la entrada activa del menú (el panel va antes del trigger en el DOM) y, al cerrarse con el foco dentro, vuelve al trigger. El `Sidebar` solo atiende Escape con el foco dentro de él, así que el shell escucha también `document:keydown.escape`.
- `p-sidebar-backdrop` se muestra siempre que el sidebar está abierto, aunque no haya overlay: solo se renderiza en móvil.
- La marca y el pie del sidebar quedan dentro de un `<aside aria-label="Barra lateral">` que contiene la `nav` (axe: todo el contenido dentro de landmarks).
- Verificación con AXE (`axe-core` como devDependency en un test de Vitest/jsdom) para la estructura; el contraste se valida manualmente en ambos temas.

### 10. Pie del sidebar
Marcador estático (avatar con iniciales genéricas y texto "Usuario") como hueco para el usuario autenticado; se sustituirá en el cambio de autenticación.

### 11. Iconografía con Lucide
- Cada icono se importa como componente standalone (`LucideHouse`, `LucideUsers`…), así el bundle solo incluye los usados (tree-shaking), y se usa como `<svg lucideHouse>`; en el catálogo, la clase va como dato y se pinta con `[lucideIcon]`.
- Tamaño por defecto 20 px y `stroke-width` 2 vía `provideLucideConfig` en los providers de la ruta del shell, para que todos los iconos sean coherentes sin repetir inputs.
- Lucide se mantiene fuera del bundle inicial: esbuild trata `@lucide/angular` como un único módulo y cada icono es un componente con su propio renderizador (~4 kB), así que cualquier import eager (incluido `provideLucideConfig` en `app.config.ts`) arrastraba todos los iconos usados a `main` y superaba el presupuesto de 500 kB.
- Iconos en botones PrimeNG: se proyectan como contenido del `p-button` (no con la prop `icon`, que espera una clase de icono de fuente).
- Asignación inicial: Inicio `House`, Colaboradores `Users`, Descansos y permisos `CalendarDays`, Ciclo de vida `RefreshCw`, Selección `UserSearch`, Compensación `BadgeDollarSign`, Skills y certificaciones `Award`, Préstamos y anticipos `HandCoins`, Reportes `ChartColumn`; topbar `PanelLeft` (trigger), `Sun`/`Moon` (tema); pie `UserRound`.
- *Alternativa:* PrimeIcons — descartado por petición expresa; Lucide da un trazo uniforme y un catálogo más amplio para los módulos de RR. HH.

### 12. Tipografía base Inter
- `@fontsource-variable/inter` importado en `styles.css` (un único fichero variable woff2 por subconjunto, cargado por `unicode-range`), sin petición a Google Fonts: funciona offline y no envía datos a terceros.
- En `styles.css`: `@theme { --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif; }`. Tailwind aplica `--font-sans` a `html`, y PrimeNG Aura hereda `font-family`, así que una sola declaración cubre utilidades y componentes.
- *Alternativa:* `<link>` a Google Fonts — descartado por dependencia externa y privacidad; `@fontsource/inter` estático — más ficheros por peso.

## Risks / Trade-offs

- [Los componentes PrimeNG siguen mostrando sus iconos internos de PrimeIcons (chevrons, cerrar, ordenar…), con un trazo algo distinto al de Lucide] → Aceptado en este cambio; cuando moleste, se sustituyen por componente mediante sus plantillas de icono (`#dropdownicon`, `#closeicon`…) con Lucide.
- [Peso de la fuente (~50 kB woff2 latin) fuera del bundle JS pero en la carga inicial] → Se sirve con `font-display: swap` (por defecto en Fontsource) y solo se descargan los subconjuntos usados.
- [El `Sidebar` compuesto es reciente en PrimeNG 22 y su API/estilos pueden cambiar en minors] → Encapsular su uso en `layout/shell`; fijar la versión con `^22.1` y revisar el changelog al actualizar.
- [Etiquetas internas en inglés del componente (rail, trigger por defecto)] → Sobrescribir con `aria-label` propio o vía `pt`; cubrirlo en el test de accesibilidad.
- [jsdom no implementa `matchMedia`] → `LayoutService` comprueba su existencia y los tests lo mockean; sin `matchMedia` se asume escritorio.
- [Script inline en `index.html` para el tema] → Si en el futuro se añade una CSP estricta, requerirá hash o nonce; alternativa aceptable: asumir un parpadeo breve.
- [Rutas generadas desde el catálogo] → Cuando un módulo real llegue, su entrada pasa a `loadChildren` de su feature; el catálogo sigue siendo la fuente del menú.

## Migration Plan

Cambio solo de frontend, sin datos. Se despliega sustituyendo el placeholder; rollback revirtiendo el commit.

## Open Questions

- Texto definitivo y nombre de producto en la cabecera del sidebar (se usa "HRIS Cleteci" con un logotipo textual hasta tener el asset).
