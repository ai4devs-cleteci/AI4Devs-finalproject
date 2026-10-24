import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import { CLETECI_PRIMARY, CLETECI_SURFACE } from './cleteci-palette';

/** Aura con la paleta de Cleteci: misma escala de superficie en ambos temas. */
export const CleteciPreset = definePreset(Aura, {
  semantic: {
    primary: CLETECI_PRIMARY,
    // El surface.300 marino es más oscuro que el slate de Aura: en claro se baja un tono para
    // igualar la intensidad del borde original de los campos.
    formField: {
      borderColor: 'light-dark({surface.200}, {surface.600})',
    },
    colorScheme: {
      light: { surface: CLETECI_SURFACE },
      dark: { surface: CLETECI_SURFACE },
    },
  },
  components: {
    sidebar: {
      // La entrada activa de la navegación se resalta con el azul de marca, no con la superficie.
      menuButton: {
        activeBackground: 'light-dark({primary.50}, {primary.950})',
        activeColor: 'light-dark({primary.700}, {primary.400})',
      },
    },
  },
});
