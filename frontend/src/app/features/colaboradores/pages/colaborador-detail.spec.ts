import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import axe from 'axe-core';
import { testUser } from '../../../../testing/auth';
import {
  API,
  AXE_OPTIONS,
  DETALLE,
  http,
  provideColaboradoresTesting,
  responderCatalogos,
} from '../../../../testing/colaboradores';

const PYT = testUser('pyt@cleteci.local', 'people-talent');
const DM = testUser('dm@cleteci.local', 'delivery-manager');

describe('ColaboradorDetail', () => {
  let harness: RouterTestingHarness;
  let root: HTMLElement;

  beforeAll(() => import('../colaboradores.routes'), 180_000);

  beforeEach(() => document.documentElement.classList.remove('dark'));
  afterEach(() => http().verify());

  async function render(user = PYT, respuesta: 'ok' | 404 = 'ok') {
    TestBed.configureTestingModule({ providers: provideColaboradoresTesting(user) });
    harness = await RouterTestingHarness.create('/colaboradores/00007');
    responderCatalogos(http());
    const req = http().expectOne(`${API}/colaboradores/00007`);
    if (respuesta === 'ok') {
      req.flush(DETALLE);
    } else {
      req.flush(
        { detail: 'No existe el colaborador 00007.' },
        { status: 404, statusText: 'Not Found' },
      );
    }
    await harness.fixture.whenStable();
    root = harness.fixture.nativeElement as HTMLElement;
  }

  const boton = (texto: string, dentro: ParentNode = root) =>
    [...dentro.querySelectorAll('button, a')].find((b) => b.textContent?.trim() === texto) as
      HTMLElement | undefined;

  const dialogo = () => document.querySelector('[role="dialog"]') as HTMLElement | null;

  async function abrir(texto: string): Promise<HTMLElement> {
    const disparador = boton(texto) as HTMLElement;
    disparador.focus();
    disparador.click();
    return vi.waitFor(() => {
      const abierto = dialogo();
      if (!abierto) throw new Error(`No se abrió el diálogo de "${texto}"`);
      return abierto;
    });
  }

  it('agrupa los datos en pestañas: identidad, posición y calculados', async () => {
    await render();

    const pestanas = [...root.querySelectorAll('[role="tab"]')] as HTMLElement[];
    expect(pestanas.map((t) => t.textContent?.trim())).toEqual([
      'Identidad',
      'Posición y contrato',
      'Datos calculados',
    ]);
    expect(pestanas[0].getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector('h1')?.textContent).toContain('María Pérez');
    const panelVisible = () =>
      [...root.querySelectorAll('[role="tabpanel"]')].find(
        (p) => !(p as HTMLElement).hidden && p.getAttribute('data-p-active') !== 'false',
      ) as HTMLElement;
    expect(panelVisible().textContent).toContain('Cédula V-12.345.678');

    pestanas[2].click();
    await harness.fixture.whenStable();
    expect(pestanas[2].getAttribute('aria-selected')).toBe('true');
    expect(panelVisible().textContent).toContain('1 año y 6 meses');
    expect(panelVisible().textContent).toContain('No elegible: En onboarding / período de prueba.');
  });

  it('muestra Editar y Eliminar a P&T, sin Cambiar proyecto', async () => {
    await render(PYT);

    expect(boton('Editar')?.getAttribute('href')).toBe('/colaboradores/00007/editar');
    expect(boton('Eliminar')).toBeDefined();
    expect(boton('Cambiar proyecto')).toBeUndefined();
  });

  it('muestra solo Cambiar proyecto al Delivery Manager', async () => {
    await render(DM);

    expect(boton('Cambiar proyecto')).toBeDefined();
    expect(boton('Editar')).toBeUndefined();
    expect(boton('Eliminar')).toBeUndefined();
  });

  it('elimina tras confirmar, vuelve al listado y avisa', async () => {
    await render();
    const confirmacion = await abrir('Eliminar');

    boton('Eliminar', confirmacion)?.click();
    const req = http().expectOne(`${API}/colaboradores/00007`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/colaboradores'));
    http()
      .match(() => true)
      .forEach((r) => r.flush({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Se eliminó el registro 00007'),
    );
  });

  it('cancelar la eliminación no borra y devuelve el foco', async () => {
    await render();
    const confirmacion = await abrir('Eliminar');

    boton('Cancelar', confirmacion)?.click();
    await vi.waitFor(() => expect(document.activeElement?.textContent?.trim()).toBe('Eliminar'));
    http().expectNone(`${API}/colaboradores/00007`);
    expect(TestBed.inject(Router).url).toBe('/colaboradores/00007');
  });

  it('el Delivery Manager cambia el proyecto entre los suyos', async () => {
    await render(DM);
    const cambio = await abrir('Cambiar proyecto');

    expect(cambio.textContent).toContain('Assa Acsel Core');
    (cambio.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    const req = http().expectOne(`${API}/colaboradores/00007/proyecto`);
    expect(req.request.body).toEqual({ version: 2, proyectoCodigo: 'ASSA_CORE' });
    req.flush({ ...DETALLE, version: 3 });
    await vi.waitFor(() => expect(document.body.textContent).toContain('Proyecto actualizado'));
  });

  it('indica que el colaborador no existe', async () => {
    await render(PYT, 404);

    expect(root.querySelector('h1')?.textContent).toContain('El colaborador no existe');
    expect(boton('Ir al listado de colaboradores')?.getAttribute('href')).toBe('/colaboradores');
  });

  for (const dark of [false, true]) {
    for (const abierto of ['ninguno', 'Eliminar', 'Cambiar proyecto'] as const) {
      it(`sin violaciones de AXE (${dark ? 'oscuro' : 'claro'}, diálogo: ${abierto})`, async () => {
        document.documentElement.classList.toggle('dark', dark);
        await render(abierto === 'Cambiar proyecto' ? DM : PYT);
        if (abierto !== 'ninguno') {
          await abrir(abierto);
        }

        const result = await axe.run(document.body, AXE_OPTIONS);
        expect(
          result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
        ).toEqual([]);
      });
    }
  }
});
