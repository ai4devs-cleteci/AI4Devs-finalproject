import { TestBed } from '@angular/core/testing';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import axe from 'axe-core';
import { FakeAuthService, TEST_USER, provideFakeAuth } from '../../../testing/auth';
import { AuthService, CurrentUser } from '../../core/auth/auth.service';
import { MatchMediaController, installMatchMedia } from '../../../testing/match-media';
import { routes } from '../../app.routes';
import { AppTitleStrategy } from '../app-title-strategy';
import { LayoutService, SIDEBAR_STORAGE_KEY } from '../layout.service';

describe('Shell', () => {
  let media: MatchMediaController;
  let harness: RouterTestingHarness;

  // La primera importación de PrimeNG y Lucide en jsdom es lenta; se precarga fuera del timeout de cada test.
  beforeAll(() => import('./shell.routes'), 180_000);

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = 'es';
  });

  afterEach(() => media.restore());

  async function render(
    url: string,
    options: { desktop: boolean; user?: CurrentUser },
  ): Promise<HTMLElement> {
    media = installMatchMedia(options);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: TitleStrategy, useExisting: AppTitleStrategy },
        provideFakeAuth(options.user ?? TEST_USER),
      ],
    });
    harness = await RouterTestingHarness.create(url);
    return harness.fixture.nativeElement as HTMLElement;
  }

  const sidebar = (root: HTMLElement) => root.querySelector('p-sidebar') as HTMLElement;
  const trigger = (root: HTMLElement) =>
    root.querySelector('button[aria-label="Mostrar u ocultar navegación"]') as HTMLButtonElement;

  const userButton = (root: HTMLElement) =>
    root.querySelector('p-sidebar-footer button') as HTMLButtonElement;
  const userMenu = () => document.querySelector('#menu-usuario_list') as HTMLElement | null;

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await harness.fixture.whenStable();
  }

  /** El menú popup se abre tras su animación de entrada: se espera a que aparezca la lista. */
  async function openUserMenu(root: HTMLElement): Promise<HTMLElement> {
    await click(userButton(root));
    return vi.waitFor(() => {
      const list = userMenu();
      if (!list) throw new Error('El menú de usuario no se ha abierto');
      return list;
    });
  }

  describe('en escritorio', () => {
    it('colapsa a iconos sin overlay y persiste el estado', async () => {
      const root = await render('/inicio', { desktop: true });

      expect(sidebar(root).getAttribute('data-collapsible-mode')).toBe('icon');
      expect(sidebar(root).hasAttribute('data-overlay')).toBe(false);
      expect(sidebar(root).getAttribute('data-state')).toBe('expanded');
      expect(trigger(root).getAttribute('aria-expanded')).toBe('true');

      await click(trigger(root));

      expect(sidebar(root).getAttribute('data-state')).toBe('collapsed');
      expect(sidebar(root).getAttribute('data-collapsible')).toBe('icon');
      expect(trigger(root).getAttribute('aria-expanded')).toBe('false');
      expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('false');
    });

    it('arranca colapsado si así se guardó', async () => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
      const root = await render('/inicio', { desktop: true });

      expect(sidebar(root).getAttribute('data-state')).toBe('collapsed');
    });
  });

  describe('en pantallas estrechas', () => {
    it('se abre superpuesto y se cierra al navegar', async () => {
      const root = await render('/inicio', { desktop: false });

      expect(sidebar(root).getAttribute('data-collapsible-mode')).toBe('offcanvas');
      expect(sidebar(root).hasAttribute('data-overlay')).toBe(true);
      expect(sidebar(root).getAttribute('data-state')).toBe('collapsed');

      await click(trigger(root));
      expect(sidebar(root).getAttribute('data-state')).toBe('expanded');

      await click(root.querySelector('a[href="/reportes"]') as HTMLElement);

      expect(sidebar(root).getAttribute('data-state')).toBe('collapsed');
      expect(TestBed.inject(LayoutService).desktopSidebarOpen()).toBe(true);
    });

    it('lleva el foco al menú al abrir y lo devuelve al trigger al cerrar con Escape', async () => {
      const root = await render('/descansos', { desktop: false });

      await click(trigger(root));
      expect(document.activeElement?.textContent?.trim()).toBe('Descansos y permisos');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await harness.fixture.whenStable();

      expect(sidebar(root).getAttribute('data-state')).toBe('collapsed');
      expect(document.activeElement).toBe(trigger(root));
    });
  });

  it('marca solo la entrada activa con aria-current, también en subrutas', async () => {
    const root = await render('/colaboradores/00042', { desktop: true });

    const current = [...root.querySelectorAll('nav a[aria-current="page"]')];
    expect(current.map((link) => link.textContent?.trim())).toEqual(['Colaboradores']);
  });

  it('muestra el título de la sección en la barra superior', async () => {
    const root = await render('/reportes', { desktop: true });

    expect(root.querySelector('header')?.textContent).toContain('Reportes');
    expect(document.title).toBe('Reportes · HRIS Cleteci');
  });

  it('el enlace "Saltar al contenido" es el primer enfocable y lleva el foco al contenido', async () => {
    const root = await render('/inicio', { desktop: true });
    const skip = root.querySelector('a, button') as HTMLAnchorElement;

    expect(skip.textContent).toContain('Saltar al contenido');
    await click(skip);

    expect(document.activeElement?.id).toBe('contenido');
  });

  describe('usuario en el pie', () => {
    it('muestra iniciales, nombre y rol principal', async () => {
      const root = await render('/inicio', { desktop: true });
      const button = userButton(root);

      expect(button.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('DM');
      expect(button.textContent).toContain('Delivery Manager');
      expect([...button.querySelectorAll('span span')].map((s) => s.textContent?.trim())).toEqual([
        'Delivery Manager',
        'Delivery Manager',
      ]);
      expect(button.getAttribute('aria-label')).toBe('Delivery Manager');
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('en modo colapsado conserva el nombre accesible', async () => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
      const root = await render('/inicio', { desktop: true });

      expect(sidebar(root).getAttribute('data-state')).toBe('collapsed');
      expect(userButton(root).getAttribute('aria-label')).toBe('Delivery Manager');
    });

    it('sin rol del HRIS muestra solo el nombre', async () => {
      const root = await render('/inicio', {
        desktop: true,
        user: { ...TEST_USER, name: 'Ana López', roles: [] },
      });

      expect(userButton(root).querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe(
        'AL',
      );
      expect(userButton(root).querySelectorAll('span span')).toHaveLength(1);
    });

    it('abre el menú con nombre, correo y "Cerrar sesión"', async () => {
      const root = await render('/inicio', { desktop: true });

      const list = await openUserMenu(root);
      const menu = list.closest('.p-menu') as HTMLElement;

      expect(menu.textContent).toContain('Delivery Manager');
      expect(menu.textContent).toContain('dm@cleteci.local');
      expect(list.textContent).toContain('Cerrar sesión');
      expect(userButton(root).getAttribute('aria-expanded')).toBe('true');
      expect(userButton(root).getAttribute('aria-controls')).toBe('menu-usuario_list');
    });

    it('"Cerrar sesión" cierra la sesión', async () => {
      const root = await render('/inicio', { desktop: true });
      const auth = TestBed.inject(AuthService) as unknown as FakeAuthService;

      const list = await openUserMenu(root);
      await click(list.querySelector('.p-menu-item-content') as HTMLElement);

      expect(auth.logoutCalls).toBe(1);
    });

    it('Escape cierra el menú y devuelve el foco al botón', async () => {
      const root = await render('/inicio', { desktop: true });

      const list = await openUserMenu(root);
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
      await harness.fixture.whenStable();

      expect(document.activeElement).toBe(userButton(root));
      await vi.waitFor(() => expect(userButton(root).getAttribute('aria-expanded')).toBe('false'));
    });
  });

  describe('accesibilidad (axe)', () => {
    const combinations = [
      { desktop: true, collapsed: false, dark: false },
      { desktop: true, collapsed: true, dark: false },
      { desktop: true, collapsed: false, dark: true },
      { desktop: true, collapsed: true, dark: true },
    ];

    for (const { desktop, collapsed, dark } of combinations) {
      for (const menuOpen of [false, true]) {
        it(`sin violaciones (${collapsed ? 'colapsado' : 'expandido'}, ${dark ? 'oscuro' : 'claro'}${menuOpen ? ', menú de usuario abierto' : ''})`, async () => {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!collapsed));
          localStorage.setItem('hris.theme', dark ? 'dark' : 'light');
          const root = await render('/inicio', { desktop });
          if (menuOpen) {
            await openUserMenu(root);
          }

          const options: axe.RunOptions = {
            runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
            // jsdom no calcula estilos: el contraste se revisa manualmente en el navegador.
            rules: { 'color-contrast': { enabled: false } },
          };
          // El popup del menú se anexa a <body> (dentro del sidebar lo recortaría su overflow):
          // se audita aparte sin la regla `region`, que exige que todo esté dentro de un landmark.
          const page = await axe.run({ exclude: [['.p-menu']] }, options);
          const popup = menuOpen
            ? await axe.run('.p-menu', {
                ...options,
                rules: { ...options.rules, region: { enabled: false } },
              })
            : null;

          expect(
            [...page.violations, ...(popup?.violations ?? [])].map(
              (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`,
            ),
          ).toEqual([]);
        });
      }
    }
  });
});
