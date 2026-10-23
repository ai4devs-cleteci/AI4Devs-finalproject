import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { UnderConstruction } from './under-construction';

describe('UnderConstruction', () => {
  it('muestra el nombre del módulo a partir del título de la ruta', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'prestamos', title: 'Préstamos y anticipos', component: UnderConstruction },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/prestamos');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Préstamos y anticipos está en construcción',
    );
  });
});
