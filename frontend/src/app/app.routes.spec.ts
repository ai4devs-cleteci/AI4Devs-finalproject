import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatchMediaController, installMatchMedia } from '../testing/match-media';
import { routes } from './app.routes';
import { AppTitleStrategy } from './layout/app-title-strategy';

describe('routes', () => {
  let media: MatchMediaController;
  let harness: RouterTestingHarness;

  // La primera importación de PrimeNG y Lucide en jsdom es lenta; se precarga fuera del timeout de cada test.
  beforeAll(() => import('./layout/shell/shell.routes'), 60_000);

  beforeEach(async () => {
    localStorage.clear();
    media = installMatchMedia({ desktop: true });
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: TitleStrategy, useExisting: AppTitleStrategy }],
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
});
