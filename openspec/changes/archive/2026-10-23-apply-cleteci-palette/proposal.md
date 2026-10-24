# Proposal

## Why

El HRIS usa el preset Aura de PrimeNG sin personalizar (primario esmeralda, superficies slate/zinc), por lo que no se reconoce como una herramienta de Cleteci. La web corporativa (https://cleteci.com/) define una identidad clara —azul `#0161EF` como primario, marinos `#001C63`/`#00174D` y fondo oscuro `#030620`— y conviene alinear la interfaz ahora, antes de que se sumen más módulos sobre los colores por defecto.

## What Changes

- Sustituir la paleta primaria esmeralda por una escala azul de Cleteci (50–950) anclada en los colores de la web: `#0161EF` (500), `#0154CF` (600), `#0037C3` (700), `#001C63` (900) y `#00174D` (950).
- Sustituir las superficies por defecto de Aura por una escala neutra con tinte marino, común a ambos temas, cuyo tono más oscuro es el fondo oscuro de la web (`#030620`).
- Definir la paleta una sola vez como tokens de diseño compartidos por los componentes PrimeNG y las utilidades Tailwind (`primary-*`, `surface-*` y una escala `brand-*` utilizable antes de que arranque PrimeNG).
- Pasar la pantalla de error de arranque de `main.ts` (botón "Reintentar", hoy esmeralda) a la paleta de marca.
- Mantener el contraste WCAG AA en tema claro y oscuro con la nueva paleta.
- Fuera de alcance: tipografía (la web usa Nunito Sans; el HRIS sigue con Inter según la spec vigente), logotipo y favicon, y los acentos violeta/cian de la web. Los colores semánticos de error (rojo) no cambian.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `app-shell`: se añade el requisito "Paleta de marca de Cleteci" (colores primario y de superficie de la interfaz en ambos temas, con contraste AA).

## Impact

- `frontend/src/app/app.config.ts`: el preset Aura pasa a un preset propio derivado (`definePreset`).
- Nuevo módulo de tema en `frontend/src/app/core/theme/` con el preset de Cleteci.
- `frontend/src/styles.css`: tokens `@theme` con la escala de marca.
- `frontend/src/main.ts`: clases de la pantalla de error de arranque.
- Plantillas que usan `primary-*`/`surface-*` (shell, páginas compartidas, colaboradores): sin cambios de código, cambian de color por el preset; se revisa su contraste.
- Tests del shell (auditorías AXE) y un test nuevo del preset. Sin cambios en backend, API ni dependencias.
