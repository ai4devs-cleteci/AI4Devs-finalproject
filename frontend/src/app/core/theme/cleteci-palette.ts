/**
 * Paleta corporativa de Cleteci (https://cleteci.com/), única fuente de los colores del tema.
 * Escalas en OKLCH sobre el matiz del azul de marca; los tonos anclados son colores de la web.
 */

export type PaletteScale = Readonly<
  Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>
>;

/** Azul de marca: 500 `#0161EF` (primario), 600 secundario, 700, 900 y 950 de la web. */
export const CLETECI_PRIMARY: PaletteScale = {
  50: '#f0f5ff',
  100: '#dce9ff',
  200: '#c3d9ff',
  300: '#9dc2ff',
  400: '#689ffd',
  500: '#0161ef',
  600: '#0154cf',
  700: '#0037c3',
  800: '#002c8d',
  900: '#001c63',
  950: '#00174d',
};

/**
 * Neutros con tinte marino para ambos temas; 950 es el fondo oscuro de la web. El 500 se oscurece
 * respecto a la interpolación porque Aura lo usa como texto atenuado en tema claro (AA sobre blanco).
 */
export const CLETECI_SURFACE: PaletteScale & { readonly 0: string } = {
  0: '#ffffff',
  50: '#f3f7ff',
  100: '#e7ebf4',
  200: '#d3d7e1',
  300: '#b6bac5',
  400: '#999eaa',
  500: '#6b707d',
  600: '#525a70',
  700: '#343c53',
  800: '#1f283f',
  900: '#0f172e',
  950: '#030620',
};
