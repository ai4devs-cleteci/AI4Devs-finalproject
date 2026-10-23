import { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import axe from 'axe-core';
import { testUser } from '../../../../testing/auth';
import { MatchMediaController, installMatchMedia } from '../../../../testing/match-media';
import {
  API,
  AXE_OPTIONS,
  DETALLE,
  http,
  provideColaboradoresTesting,
  responderCatalogos,
} from '../../../../testing/colaboradores';
import { ColaboradorForm } from './colaborador-form';
import { ColaboradorFormModel, modeloDe } from './colaborador-form.model';

const PYT = testUser('pyt@cleteci.local', 'people-talent');

describe('ColaboradorForm', () => {
  let harness: RouterTestingHarness;
  let root: HTMLElement;
  let media: MatchMediaController;

  beforeAll(() => import('../colaboradores.routes'), 180_000);

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    // El overlay de p-select consulta matchMedia, que jsdom no implementa.
    media = installMatchMedia({ desktop: true });
  });
  afterEach(() => {
    media.restore();
    http().verify();
  });

  async function render(url = '/colaboradores/nuevo') {
    TestBed.configureTestingModule({ providers: provideColaboradoresTesting(PYT) });
    harness = await RouterTestingHarness.create(url);
    responderCatalogos(http());
    if (url.endsWith('/editar')) {
      http().expectOne(`${API}/colaboradores/00007`).flush(DETALLE);
    }
    await harness.fixture.whenStable();
    root = harness.fixture.nativeElement as HTMLElement;
  }

  /** Modelo del formulario montado, para rellenarlo sin simular cada control. */
  const modelo = () =>
    (
      harness.fixture.debugElement.query(By.directive(ColaboradorForm)).componentInstance as {
        modelo: WritableSignal<ColaboradorFormModel>;
      }
    ).modelo;

  async function rellenar(): Promise<void> {
    modelo().set({ ...modeloDe(DETALLE), proyectoCodigo: '' });
    await harness.fixture.whenStable();
  }

  async function guardar(): Promise<void> {
    (root.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve));
    harness.fixture.detectChanges();
  }

  const input = (campo: string) => root.querySelector(`#campo-${campo}`) as HTMLInputElement;
  const error = (campo: string) => root.querySelector(`#error-${campo}`)?.textContent?.trim();

  it('no envía con campos obligatorios vacíos, marca cada uno y enfoca el primero', async () => {
    await render();
    await guardar();

    http().expectNone(`${API}/colaboradores`);
    expect(error('nombreCompleto')).toBe('Este campo es obligatorio.');
    expect(error('paisResidenciaCodigo')).toBe('Este campo es obligatorio.');
    expect(error('fechaNacimiento')).toBeUndefined();
    expect(input('nombreCompleto').getAttribute('aria-invalid')).toBe('true');
    expect(input('nombreCompleto').getAttribute('aria-describedby')).toBe('error-nombreCompleto');
    await vi.waitFor(() => expect(document.activeElement).toBe(input('nombreCompleto')));
  });

  it('no marca un campo por el que solo se pasa sin modificarlo', async () => {
    await render();
    input('nombreCorto').dispatchEvent(new Event('focus'));
    input('nombreCorto').dispatchEvent(new Event('blur'));
    harness.fixture.detectChanges();

    expect(error('nombreCorto')).toBeUndefined();
    expect(input('nombreCorto').getAttribute('aria-invalid')).toBe('false');
  });

  it('marca al salir un campo modificado que queda inválido', async () => {
    await render();
    const telefono = input('telefono');
    telefono.value = '0412';
    telefono.dispatchEvent(new Event('input'));
    harness.fixture.detectChanges();
    expect(error('telefono')).toBeUndefined();

    telefono.dispatchEvent(new Event('blur'));
    harness.fixture.detectChanges();
    expect(error('telefono')).toContain('código de país');
    expect(error('nombreCompleto')).toBeUndefined();

    telefono.value = '+584121234567';
    telefono.dispatchEvent(new Event('input'));
    harness.fixture.detectChanges();
    expect(error('telefono')).toBeUndefined();
  });

  it('valida el teléfono como la API', async () => {
    await render();
    await rellenar();
    modelo().update((m) => ({ ...m, telefono: '04121234567' }));
    await guardar();

    http().expectNone(`${API}/colaboradores`);
    expect(error('telefono')).toContain('código de país');
  });

  it('da de alta, abre la ficha y avisa', async () => {
    await render();
    await rellenar();
    await guardar();

    const req = http().expectOne(`${API}/colaboradores`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      documento: 'V-12.345.678',
      tipoDocumento: 'CEDULA',
      fechaIngreso: '2025-04-15',
      proyectoCodigo: null,
    });
    expect(req.request.body.version).toBeUndefined();
    req.flush(DETALLE);

    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/colaboradores/00007'));
    responderCatalogos(http());
    http()
      .match(`${API}/colaboradores/00007`)
      .forEach((r) => r.flush(DETALLE));
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('María Pérez se registró con el ID 00007'),
    );
  });

  it('muestra el documento duplicado en su campo y conserva los datos', async () => {
    await render();
    await rellenar();
    await guardar();

    http()
      .expectOne(`${API}/colaboradores`)
      .flush(
        {
          detail: 'Ya existe un colaborador con ese documento: 00003.',
          codigo: 'colaborador.documento-duplicado',
          colaboradorExistente: '00003',
          errors: [
            { field: 'documento', message: 'Ya existe un colaborador con ese documento: 00003.' },
          ],
        },
        { status: 409, statusText: 'Conflict' },
      );
    await vi.waitFor(() => {
      harness.fixture.detectChanges();
      expect(error('documento')).toContain('00003');
    });
    expect(input('documento').value).toBe('V-12.345.678');
    expect(input('nombreCompleto').value).toBe('María José Pérez Rodríguez');
    await vi.waitFor(() => expect(document.activeElement).toBe(input('documento')));
  });

  it('edita con la versión leída y bloquea un proyecto ya asignado', async () => {
    await render('/colaboradores/00007/editar');

    expect(input('nombreCorto').value).toBe('María Pérez');
    expect(root.textContent).toContain('El cambio de proyecto corresponde a su Delivery Manager.');
    await guardar();

    const req = http().expectOne(`${API}/colaboradores/00007`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({ version: 2, proyectoCodigo: 'ASSA_CORE' });
    req.flush(DETALLE);
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/colaboradores/00007'));
    responderCatalogos(http());
    http()
      .match(`${API}/colaboradores/00007`)
      .forEach((r) => r.flush(DETALLE));
  });

  it('avisa de un conflicto de edición y permite recargar', async () => {
    await render('/colaboradores/00007/editar');
    await guardar();

    http().expectOne(`${API}/colaboradores/00007`).flush(
      {
        detail: 'El registro fue modificado por otra persona.',
        codigo: 'error.version-desactualizada',
      },
      { status: 409, statusText: 'Conflict' },
    );
    const alerta = await vi.waitFor(() => {
      harness.fixture.detectChanges();
      const encontrada = root.querySelector('[role="alert"]');
      if (!encontrada) throw new Error('Sin aviso de conflicto');
      return encontrada as HTMLElement;
    });
    expect(alerta.textContent).toContain('Otra persona modificó este registro');

    (alerta.querySelector('button') as HTMLButtonElement).click();
    http()
      .expectOne(`${API}/colaboradores/00007`)
      .flush({ ...DETALLE, version: 3, nombreCorto: 'Majo' });
    await vi.waitFor(() => {
      harness.fixture.detectChanges();
      expect(input('nombreCorto').value).toBe('Majo');
    });
  });

  it('p-select y los inputs se enlazan en ambos sentidos con [formField]', async () => {
    await render();
    await rellenar();
    harness.fixture.detectChanges();

    expect(root.querySelector('#campo-tipoDocumento')?.textContent).toContain('Cédula');
    expect(input('fechaIngreso').value).toBe('2025-04-15');

    input('nombreCorto').value = 'Majo';
    input('nombreCorto').dispatchEvent(new Event('input'));
    expect(modelo()().nombreCorto).toBe('Majo');

    (root.querySelector('#campo-tipoDocumento') as HTMLElement).click();
    const pasaporte = await vi.waitFor(() => {
      const opcion = [...document.querySelectorAll('[role="option"]')].find((o) =>
        o.textContent?.includes('Pasaporte'),
      );
      if (!opcion) throw new Error('Sin opciones');
      return opcion as HTMLElement;
    });
    pasaporte.click();
    expect(modelo()().tipoDocumento).toBe('PASAPORTE');
  });

  for (const dark of [false, true]) {
    it(`sin violaciones de AXE con errores visibles (${dark ? 'oscuro' : 'claro'})`, async () => {
      document.documentElement.classList.toggle('dark', dark);
      await render();
      await guardar();

      const result = await axe.run(root, AXE_OPTIONS);
      expect(
        result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
      ).toEqual([]);
    });
  }
});
