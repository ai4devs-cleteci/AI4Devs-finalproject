import { NAVIGATION } from './navigation';

describe('NAVIGATION', () => {
  const items = NAVIGATION.flatMap((group) => group.items);

  it('define tres grupos con nueve entradas en el orden del spec', () => {
    expect(NAVIGATION.map((group) => group.label)).toEqual(['Personas', 'Gestión', 'Análisis']);
    expect(items.map((item) => item.label)).toEqual([
      'Inicio',
      'Colaboradores',
      'Descansos y permisos',
      'Ciclo de vida',
      'Selección',
      'Compensación',
      'Skills y certificaciones',
      'Préstamos y anticipos',
      'Reportes',
    ]);
  });

  it('no repite paths y todos son segmentos sin barra', () => {
    const paths = items.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
    paths.forEach((path) => expect(path).toMatch(/^[a-z-]+$/));
  });

  it('asigna un icono Lucide a cada entrada', () => {
    items.forEach((item) => expect(item.icon.icon.node.length).toBeGreaterThan(0));
  });
});
