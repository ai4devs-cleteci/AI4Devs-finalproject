import { TestBed } from '@angular/core/testing';
import { MatchMediaController, installMatchMedia } from '../../../testing/match-media';
import { LayoutService } from '../layout.service';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let media: MatchMediaController;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    media = installMatchMedia({ desktop: true, dark: false });
  });

  afterEach(() => media.restore());

  it('alterna el tema, la clase .dark y aria-pressed', async () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;

    expect(button.getAttribute('aria-label')).toBe('Tema oscuro');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    await fixture.whenStable();

    expect(TestBed.inject(LayoutService).darkMode()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
