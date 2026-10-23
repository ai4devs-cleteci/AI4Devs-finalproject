import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import axe from 'axe-core';
import { testUser } from '../../../../testing/auth';
import {
  API,
  AXE_OPTIONS,
  RESUMEN,
  http,
  pagina,
  provideColaboradoresTesting,
  responderCatalogos,
} from '../../../../testing/colaboradores';

describe('ColaboradorList', () => {
  let harness: RouterTestingHarness;

  beforeAll(() => import('../colaboradores.routes'), 180_000);

  beforeEach(() => document.documentElement.classList.remove('dark'));
  afterEach(() => http().verify());

  async function render(url: string, user = testUser('pyt@cleteci.local', 'people-talent')) {
    TestBed.configureTestingModule({ providers: provideColaboradoresTesting(user) });
    harness = await RouterTestingHarness.create(url);
    responderCatalogos(http());
    return harness.fixture.nativeElement as HTMLElement;
  }

  /** Espera a que el listado pida `url` (puede llegar tras un debounce o una navegación) y responde. */
  async function responderListado(url: string, items = [RESUMEN], total?: number) {
    await vi.waitFor(() => http().expectOne(url).flush(pagina(items, total)));
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
  }

  it('muestra las filas y el botón de alta a P&T', async () => {
    const root = await render('/colaboradores');
    await responderListado(`${API}/colaboradores?page=0&size=20&sort=id,asc`);

    const fila = root.querySelector('tbody tr') as HTMLElement;
    expect(fila.textContent).toContain('00007');
    expect(fila.textContent).toContain('María Pérez');
    expect(fila.textContent).toContain('Assa Acsel Core');
    expect(fila.textContent).toContain('15/04/2025');
    expect(fila.querySelector('a')?.getAttribute('href')).toBe('/colaboradores/00007');
    expect(root.querySelector('a[href="/colaboradores/nuevo"]')?.textContent).toContain(
      'Nuevo colaborador',
    );
  });

  it('oculta el alta a Dirección', async () => {
    const root = await render('/colaboradores', testUser('direccion@cleteci.local', 'direccion'));
    await responderListado(`${API}/colaboradores?page=0&size=20&sort=id,asc`);

    expect(root.querySelector('table')).not.toBeNull();
    expect(root.textContent).not.toContain('Nuevo colaborador');
  });

  it('indica cuando no hay resultados', async () => {
    const root = await render('/colaboradores?q=nadie');
    await responderListado(`${API}/colaboradores?page=0&size=20&sort=id,asc&q=nadie`, []);

    expect(root.textContent).toContain('No hay colaboradores que coincidan');
  });

  it('al buscar vuelve a la primera página y lo refleja en la URL', async () => {
    const root = await render('/colaboradores?page=2');
    await responderListado(`${API}/colaboradores?page=2&size=20&sort=id,asc`, [RESUMEN], 60);

    const buscar = root.querySelector('#buscar-colaborador') as HTMLInputElement;
    buscar.value = 'pérez';
    buscar.dispatchEvent(new Event('input'));

    await responderListado(`${API}/colaboradores?page=0&size=20&sort=id,asc&q=p%C3%A9rez`);
    expect(TestBed.inject(Router).url).toBe('/colaboradores?q=p%C3%A9rez');
  });

  it('ordena por columna y alterna la dirección', async () => {
    const root = await render('/colaboradores');
    await responderListado(`${API}/colaboradores?page=0&size=20&sort=id,asc`);

    const nombre = [...root.querySelectorAll('th button')].find((b) =>
      b.textContent?.includes('Nombre'),
    ) as HTMLButtonElement;
    nombre.click();
    await responderListado(`${API}/colaboradores?page=0&size=20&sort=nombreCorto,asc`);
    expect(nombre.closest('th')?.getAttribute('aria-sort')).toBe('ascending');

    nombre.click();
    await responderListado(`${API}/colaboradores?page=0&size=20&sort=nombreCorto,desc`);
    expect(nombre.closest('th')?.getAttribute('aria-sort')).toBe('descending');
  });

  for (const dark of [false, true]) {
    it(`sin violaciones de AXE (${dark ? 'oscuro' : 'claro'})`, async () => {
      document.documentElement.classList.toggle('dark', dark);
      const root = await render('/colaboradores');
      await responderListado(`${API}/colaboradores?page=0&size=20&sort=id,asc`);

      const result = await axe.run(root, AXE_OPTIONS);
      expect(
        result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
      ).toEqual([]);
    });
  }
});
