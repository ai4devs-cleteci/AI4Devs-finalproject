import { CLETECI_PRIMARY as P, CLETECI_SURFACE as S } from './cleteci-palette';

/** Relación de contraste WCAG 2.1 entre dos colores `#rrggbb`. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

describe('Paleta de Cleteci', () => {
  it('conserva los colores de la web', () => {
    expect(P[500]).toBe('#0161ef');
    expect(P[900]).toBe('#001c63');
    expect(P[950]).toBe('#00174d');
    expect(S[950]).toBe('#030620');
  });

  describe('tema claro', () => {
    it.each([
      ['botón primario', '#ffffff', P[500]],
      ['botón primario en hover', '#ffffff', P[600]],
      ['distintivo del shell', '#ffffff', P[700]],
      ['entrada activa de la navegación', P[700], P[50]],
      ['avatar', P[800], P[100]],
      ['texto atenuado de Aura', S[500], S[0]],
      ['texto atenuado sobre fondo', S[500], S[50]],
      ['texto secundario del shell', S[600], S[0]],
      ['enlaces', P[700], S[0]],
    ])('%s alcanza 4,5:1', (_, text, background) => {
      expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    });

    it('el foco primario contrasta 3:1 con la superficie', () => {
      expect(contrast(P[500], S[0])).toBeGreaterThanOrEqual(3);
    });
  });

  describe('tema oscuro', () => {
    it.each([
      ['botón primario', S[900], P[400]],
      ['distintivo del shell', S[950], P[400]],
      ['entrada activa de la navegación', P[400], P[950]],
      ['avatar', P[100], P[900]],
      ['texto atenuado de Aura', S[400], S[900]],
      ['texto atenuado sobre fondo', S[400], S[950]],
      ['enlaces', P[300], S[900]],
    ])('%s alcanza 4,5:1', (_, text, background) => {
      expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    });

    it('el foco primario contrasta 3:1 con la superficie', () => {
      expect(contrast(P[400], S[900])).toBeGreaterThanOrEqual(3);
      expect(contrast(P[400], S[950])).toBeGreaterThanOrEqual(3);
    });
  });
});
