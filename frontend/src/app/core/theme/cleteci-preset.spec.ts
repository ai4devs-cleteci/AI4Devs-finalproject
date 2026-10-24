import { CleteciPreset } from './cleteci-preset';

describe('CleteciPreset', () => {
  const semantic = CleteciPreset.semantic as {
    primary: Record<number, string>;
    colorScheme: Record<'light' | 'dark', { surface: Record<number, string> }>;
  };

  it('usa el azul de marca como primario', () => {
    expect(semantic.primary[500]).toBe('#0161ef');
  });

  it('suaviza el borde de los campos en tema claro', () => {
    const formField = (CleteciPreset.semantic as { formField: Record<string, string> }).formField;
    expect(formField['borderColor']).toBe('light-dark({surface.200}, {surface.600})');
  });

  it('resalta la entrada activa de la navegación con el azul de marca', () => {
    const sidebar = (
      CleteciPreset.components as { sidebar: { menuButton: Record<string, string> } }
    ).sidebar.menuButton;
    expect(sidebar['activeBackground']).toBe('light-dark({primary.50}, {primary.950})');
    expect(sidebar['activeColor']).toBe('light-dark({primary.700}, {primary.400})');
  });

  it.each(['light', 'dark'] as const)('usa las superficies marinas en tema %s', (scheme) => {
    expect(semantic.colorScheme[scheme].surface[950]).toBe('#030620');
    expect(semantic.colorScheme[scheme].surface[0]).toBe('#ffffff');
  });
});
