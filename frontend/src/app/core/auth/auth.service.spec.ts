import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEvent, KeycloakEventType } from 'keycloak-angular';
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const events = signal<KeycloakEvent>({ type: KeycloakEventType.Ready, args: true });
  let keycloak: {
    tokenParsed: KeycloakTokenParsed | undefined;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  function setup(token: KeycloakTokenParsed | undefined): AuthService {
    keycloak = {
      tokenParsed: token,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    events.set({ type: KeycloakEventType.Ready, args: true });
    TestBed.configureTestingModule({
      providers: [
        { provide: Keycloak, useValue: keycloak },
        { provide: KEYCLOAK_EVENT_SIGNAL, useValue: events },
      ],
    });
    return TestBed.inject(AuthService);
  }

  it('expone el perfil a partir de los claims', () => {
    const auth = setup({
      sub: 'f3a1',
      preferred_username: 'pyt@cleteci.local',
      name: 'People Talent',
      email: 'pyt@cleteci.local',
      realm_access: { roles: ['people-talent', 'offline_access', 'uma_authorization'] },
    });

    expect(auth.user()).toEqual({
      id: 'f3a1',
      username: 'pyt@cleteci.local',
      name: 'People Talent',
      email: 'pyt@cleteci.local',
      roles: ['people-talent'],
    });
    expect(auth.hasRole('people-talent')).toBe(true);
    expect(auth.hasRole('direccion')).toBe(false);
  });

  it('usa el nombre de usuario si falta el nombre', () => {
    const auth = setup({ sub: 'b2', preferred_username: 'dm@cleteci.local' });

    expect(auth.user()?.name).toBe('dm@cleteci.local');
    expect(auth.user()?.email).toBeNull();
    expect(auth.user()?.roles).toEqual([]);
  });

  it('excluye los roles por defecto de Keycloak', () => {
    const auth = setup({
      sub: 'c3',
      realm_access: { roles: ['default-roles-hris', 'offline_access', 'uma_authorization'] },
    });

    expect(auth.user()?.roles).toEqual([]);
  });

  it('no hay usuario sin token', () => {
    expect(setup(undefined).user()).toBeNull();
  });

  it('relee el token al renovarse', () => {
    const auth = setup({ sub: 'd4', name: 'Antes' });
    expect(auth.user()?.name).toBe('Antes');

    keycloak.tokenParsed = { sub: 'd4', name: 'Después' };
    events.set({ type: KeycloakEventType.AuthRefreshSuccess });

    expect(auth.user()?.name).toBe('Después');
  });

  it('cierra la sesión en Keycloak volviendo al origen', async () => {
    const auth = setup({ sub: 'e5' });

    await auth.logout();

    expect(keycloak.logout).toHaveBeenCalledWith({ redirectUri: `${location.origin}/` });
  });

  it('pide de nuevo el login si falla la renovación', () => {
    setup({ sub: 'f6' });

    events.set({ type: KeycloakEventType.AuthRefreshError });
    TestBed.inject(ApplicationRef).tick();

    expect(keycloak.login).toHaveBeenCalledOnce();
  });
});
