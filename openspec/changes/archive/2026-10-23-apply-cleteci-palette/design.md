# Design

## Context

- `app.config.ts` registra `providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.dark' } } })` sin personalizar: primario esmeralda y superficies `slate` (claro) / `zinc` (oscuro).
- Las plantillas no usan colores fijos salvo el rojo de errores: usan `primary-*` y `surface-*` de `tailwindcss-primeui`, que leen las variables `--p-primary-*`/`--p-surface-*` del preset. Cambiar el preset recolorea el shell, las páginas compartidas y colaboradores sin tocar plantillas.
- Excepción: la pantalla de error de arranque de `main.ts` se pinta cuando el bootstrap falla, sin garantía de que PrimeNG haya inyectado sus variables; por eso hoy usa `emerald-*` de Tailwind.
- Paleta extraída de las variables `--aw-color-*` y de las clases de https://cleteci.com/: primario `rgb(1 97 239)` = `#0161EF`, secundario `#0154CF`, `#0037C3` (bloque "por qué Cleteci"), `#001C63`, pie `#00174D`, fondo oscuro `rgb(3 6 32)` = `#030620`; acentos violeta `#6D28D9`/`#8D46E7` y cian `#00FFFF`.
- Requisitos: ver `specs/app-shell/spec.md` (paleta y contraste AA).

## Goals / Non-Goals

**Goals:**
- Un preset PrimeNG propio derivado de Aura con las escalas `primary` y `surface` de Cleteci, válido para ambos temas.
- Una única definición de los valores de la paleta, verificable por test (contraste AA de las combinaciones que usa la interfaz).

**Non-Goals:**
- Redefinir otros tokens de Aura (radios, sombras, espaciados, tokens por componente).
- Exponer los acentos violeta/cian como tokens: ningún componente los necesita todavía.
- Cambiar los colores semánticos (rojo de errores, verdes/ámbar de `Tag` o `Message`).

## Decisions

### 1. Escalas de la paleta

Escalas generadas en OKLCH a partir del matiz del azul de marca (≈ 260°), fijando los colores de la web como anclas y ajustando la luminosidad para AA:

| Tono | `primary` (azul Cleteci) | `surface` (neutro marino) |
|------|--------------------------|---------------------------|
| 0    | —                        | `#ffffff`                 |
| 50   | `#f0f5ff`                | `#f3f7ff`                 |
| 100  | `#dce9ff`                | `#e7ebf4`                 |
| 200  | `#c3d9ff`                | `#d3d7e1`                 |
| 300  | `#9dc2ff`                | `#b6bac5`                 |
| 400  | `#689ffd`                | `#999eaa`                 |
| 500  | `#0161ef` (ancla)        | `#6b707d`                 |
| 600  | `#0154cf` (ancla)        | `#525a70`                 |
| 700  | `#0037c3` (ancla)        | `#343c53`                 |
| 800  | `#002c8d`                | `#1f283f`                 |
| 900  | `#001c63` (ancla)        | `#0f172e`                 |
| 950  | `#00174d` (ancla)        | `#030620` (ancla)         |

Contrastes calculados de las combinaciones que usa Aura y el shell:

- Claro: botón primario blanco sobre `primary.500` 5,3:1 (hover `600` 6,6:1); resaltado `primary.700` sobre `primary.50` 8,2:1; texto atenuado `surface.500` sobre `surface.0` 4,95:1 y sobre `surface.50` 4,6:1; `surface.600` sobre blanco 6,9:1.
- Oscuro: `primary.400` con texto `surface.900` 6,7:1 (Aura usa `primary.400` como color primario oscuro); `primary.400` sobre `surface.950` 7,6:1 (distintivo del shell); texto atenuado `surface.400` sobre `surface.900` 6,6:1.

`surface.500` se oscureció respecto a la interpolación lineal (que daba 4,3:1 sobre blanco) porque Aura lo usa como `text.mutedColor` en tema claro.

Alternativas: usar `#0161EF` como `600` y regenerar `500` más claro (descartada: el `500` es el fondo del botón primario en Aura y un tono más claro no llega a 4,5:1 con texto blanco); superficies `slate` de Aura en claro y marino solo en oscuro (descartada: dos familias de gris distintas por tema y el `slate` no lleva el tinte de la marca).

### 2. Misma escala de superficie para ambos temas

Aura define `surface` dentro de `colorScheme.light` y `colorScheme.dark`. El preset sobrescribe ambas con la misma escala marina, de forma que `surface-*` en plantillas significa el mismo color en los dos temas (como ya asumen las clases `dark:` del shell) y el fondo oscuro coincide con el de la web.

### 3. Fuente de verdad en TypeScript

- `src/app/core/theme/cleteci-palette.ts`: constantes `CLETECI_PRIMARY` y `CLETECI_SURFACE` (objetos tono → hex).
- `src/app/core/theme/cleteci-preset.ts`: `definePreset(Aura, { semantic: { primary: CLETECI_PRIMARY, colorScheme: { light: { surface: CLETECI_SURFACE }, dark: { surface: CLETECI_SURFACE } } } })`.
- `app.config.ts` importa `CleteciPreset` en lugar de `Aura`.

El preset también fija los tokens `sidebar.menuButton.activeBackground`/`activeColor` (`primary.50`/`primary.700` en claro, `primary.950`/`primary.400` en oscuro, 8,2:1 y 6,5:1), porque Aura resalta la entrada activa con la superficie; `shell.css` hace que su icono herede ese color. Además, `formField.borderColor` pasa en claro de `surface.300` a `surface.200` (1,44:1 sobre blanco, como el `slate-300` original de Aura con 1,48:1), porque el `surface.300` marino es más oscuro y los campos se veían más marcados.

Ambos ficheros son datos puros; entran en el bundle inicial como hoy entra Aura (sin impacto relevante de tamaño).

Alternativa: declarar la paleta en `styles.css` (`@theme static`) y que el preset la referencie con `var(--color-…)`. Descartada: los tests en jsdom no resuelven variables CSS, así que el contraste no se podría verificar sobre los valores reales, y PrimeNG deja de conocer los colores concretos.

### 4. Pantalla de error de arranque con tokens de Tailwind

`styles.css` declara en `@theme` la escala `--color-cleteci-50` … `--color-cleteci-950` (copia de `CLETECI_PRIMARY`), y `main.ts` pasa de `emerald-700/800` a `cleteci-600` (fondo, 6,6:1 con blanco), `cleteci-700` (hover) y `cleteci-600` (outline de foco). Así la pantalla no depende de que PrimeNG haya arrancado.

Para que la copia no diverja, un test importa `styles.css?raw` y comprueba que cada `--color-cleteci-N` coincide con `CLETECI_PRIMARY[N]`.

### 5. Verificación de contraste por test

`cleteci-palette.spec.ts` incluye una función de contraste WCAG (luminancia relativa) y comprueba las parejas listadas en la decisión 1 con sus umbrales (4,5:1 texto, 3:1 foco). Complementa a AXE, que en jsdom tiene desactivada la regla de contraste.

## Risks / Trade-offs

- [Componentes PrimeNG que derivan colores del `primary` con `color-mix` (resaltados en oscuro) pueden quedar con contraste distinto al calculado] → revisión visual en ambos temas de navegación, formulario, tabla y diálogos de colaboradores durante la implementación.
- [La copia de la escala en `styles.css` puede divergir] → test de sincronía (decisión 4).
- [El azul de marca es menos distinguible del azul de "info" de Aura en `Tag`/`Message`] → aceptado; si molesta, se ajusta el token de severidad `info` en un cambio posterior.

## Migration Plan

Cambio solo de frontend, sin datos ni API. Rollback: volver a `preset: Aura` en `app.config.ts` y a las clases `emerald-*` en `main.ts`.
