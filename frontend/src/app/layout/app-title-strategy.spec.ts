import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppTitleStrategy } from './app-title-strategy';

@Component({ template: '' })
class Blank {}

describe('AppTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'reportes', title: 'Reportes', component: Blank },
          { path: 'sin-titulo', component: Blank },
        ]),
        { provide: TitleStrategy, useExisting: AppTitleStrategy },
      ],
    });
  });

  it('actualiza document.title y la sección actual al navegar', async () => {
    const harness = await RouterTestingHarness.create();
    const strategy = TestBed.inject(AppTitleStrategy);

    await harness.navigateByUrl('/reportes');
    expect(TestBed.inject(Title).getTitle()).toBe('Reportes · HRIS Cleteci');
    expect(strategy.current()).toBe('Reportes');

    await harness.navigateByUrl('/sin-titulo');
    expect(TestBed.inject(Title).getTitle()).toBe('HRIS Cleteci');
    expect(strategy.current()).toBeUndefined();
  });
});
