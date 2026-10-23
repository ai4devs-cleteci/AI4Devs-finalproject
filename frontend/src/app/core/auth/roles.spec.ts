import { isHrisRole, primaryRole } from './roles';

describe('roles', () => {
  it('elige el rol de mayor prioridad', () => {
    expect(primaryRole(['colaborador', 'direccion', 'people-talent'])).toBe('direccion');
    expect(primaryRole(['delivery-manager', 'colaborador'])).toBe('delivery-manager');
  });

  it('devuelve null sin roles del HRIS', () => {
    expect(primaryRole([])).toBeNull();
  });

  it('distingue los roles del HRIS de los de Keycloak', () => {
    expect(isHrisRole('people-talent')).toBe(true);
    expect(isHrisRole('offline_access')).toBe(false);
    expect(isHrisRole('default-roles-hris')).toBe(false);
  });
});
