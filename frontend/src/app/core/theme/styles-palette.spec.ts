import styles from '../../../styles.css' with { loader: 'text' };

import { CLETECI_PRIMARY } from './cleteci-palette';

describe('Tokens de Tailwind de Cleteci', () => {
  it.each(Object.entries(CLETECI_PRIMARY))(
    '--color-cleteci-%s coincide con la paleta',
    (tone, hex) => {
      expect(styles).toContain(`--color-cleteci-${tone}: ${hex};`);
    },
  );
});
