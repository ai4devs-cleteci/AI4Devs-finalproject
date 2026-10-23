import { TestBed } from '@angular/core/testing';
import { MatchMediaController, installMatchMedia } from '../../testing/match-media';
import { LayoutService, SIDEBAR_STORAGE_KEY, THEME_STORAGE_KEY } from './layout.service';

describe('LayoutService', () => {
  let media: MatchMediaController;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    media?.restore();
    vi.restoreAllMocks();
  });

  function create(options: { desktop: boolean; dark?: boolean }): LayoutService {
    media = installMatchMedia(options);
    const service = TestBed.inject(LayoutService);
    TestBed.tick();
    return service;
  }

  it('arranca expandido, con el sidebar móvil cerrado y el tema del sistema si no hay nada guardado', () => {
    const service = create({ desktop: true, dark: true });

    expect(service.isDesktop()).toBe(true);
    expect(service.desktopSidebarOpen()).toBe(true);
    expect(service.mobileSidebarOpen()).toBe(false);
    expect(service.darkMode()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('restaura los valores guardados', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    const service = create({ desktop: true, dark: true });

    expect(service.desktopSidebarOpen()).toBe(false);
    expect(service.darkMode()).toBe(false);
  });

  it('persiste el estado del sidebar al cambiar', () => {
    const service = create({ desktop: true });

    service.desktopSidebarOpen.set(false);
    TestBed.tick();

    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false');
  });

  it('persiste solo la elección explícita de tema y aplica la clase .dark', () => {
    const service = create({ desktop: true });
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

    service.toggleDarkMode();
    TestBed.tick();

    expect(service.darkMode()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('funciona con valores por defecto si el almacenamiento lanza excepciones', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });

    const service = create({ desktop: true });
    service.toggleDarkMode();
    TestBed.tick();

    expect(service.desktopSidebarOpen()).toBe(true);
    expect(service.darkMode()).toBe(true);
  });

  it('sigue el cambio de breakpoint y cierra el overlay móvil', () => {
    const service = create({ desktop: false });
    expect(service.isDesktop()).toBe(false);
    service.mobileSidebarOpen.set(true);

    media.setDesktop(true);

    expect(service.isDesktop()).toBe(true);
    expect(service.mobileSidebarOpen()).toBe(false);
  });
});
