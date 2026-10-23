import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FakeAuthService, provideFakeAuth, testUser } from '../testing/auth';
import { AuthService } from './core/auth/auth.service';
import { MatchMediaController, installMatchMedia } from '../testing/match-media';
import { routes } from './app.routes';
import { AppTitleStrategy } from './layout/app-title-strategy';

describe('routes', () => {
  let media: MatchMediaController;
  let harness: RouterTestingHarness;

  // La primera importación de PrimeNG y Lucide en jsdom es lenta; se precarga fuera del timeout de cada test.
  beforeAll(() => import('./layout/shell/shell.routes'), 180_000);

  beforeEach(async () => {
    localStorage.clear();
    media = installMatchMedia({ desktop: true });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: TitleStrategy, useExisting: AppTitleStrategy },
        provideFakeAuth(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => media.restore());

  const content = () =>
    harness.fixture.nativeElement.querySelector('main#contenido') as HTMLElement;

  it('redirige la raíz a /inicio dentro del shell', async () => {
    await harness.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/inicio');
    expect(content().textContent).toContain('Inicio está en construcción');
  });

  it('muestra la página provisional de un módulo sin implementar', async () => {
    await harness.navigateByUrl('/prestamos');

    expect(content().textContent).toContain('Préstamos y anticipos está en construcción');
  });

  it('muestra el 404 dentro del shell para rutas desconocidas', async () => {
    await harness.navigateByUrl('/no-existe');

    expect(content().querySelector('h1')?.textContent).toContain('Página no encontrada');
    expect(harness.fixture.nativeElement.querySelector('nav')).not.toBeNull();
  });

  describe('colaboradores', () => {
    const fake = () => TestBed.inject(AuthService) as unknown as FakeAuthService;

    it('carga la feature en lugar de la página provisional', async () => {
      fake().current.set(testUser('pyt@cleteci.local', 'people-talent'));
      await harness.navigateByUrl('/colaboradores');

      expect(content().querySelector('h1')?.textContent).toContain('Colaboradores');
      expect(content().textContent).not.toContain('en construcción');
    });

    it('lleva a /sin-acceso al rol Colaborador', async () => {
      fake().current.set(testUser('colaborador@cleteci.local', 'colaborador'));
      await harness.navigateByUrl('/colaboradores');

      expect(TestBed.inject(Router).url).toBe('/sin-acceso');
      expect(content().querySelector('h1')?.textContent).toContain('No tienes acceso');
    });

    it('impide el alta a Dirección', async () => {
      fake().current.set(testUser('direccion@cleteci.local', 'direccion'));
      await harness.navigateByUrl('/colaboradores/nuevo');

      expect(TestBed.inject(Router).url).toBe('/sin-acceso');
    });
  });
});
