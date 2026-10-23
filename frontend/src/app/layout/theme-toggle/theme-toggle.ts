import { Component, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';
import { ButtonDirective, ButtonIcon } from 'primeng/button';
import { LayoutService } from '../layout.service';

/** Conmutador claro/oscuro: patrón de botón alternable (etiqueta fija + `aria-pressed`). */
@Component({
  selector: 'app-theme-toggle',
  imports: [ButtonDirective, ButtonIcon, LucideSun, LucideMoon],
  template: `
    <button
      type="button"
      pButton
      text
      rounded
      iconOnly
      severity="secondary"
      aria-label="Tema oscuro"
      [attr.aria-pressed]="layout.darkMode()"
      (click)="layout.toggleDarkMode()"
    >
      @if (layout.darkMode()) {
        <svg lucideSun pButtonIcon aria-hidden="true"></svg>
      } @else {
        <svg lucideMoon pButtonIcon aria-hidden="true"></svg>
      }
    </button>
  `,
})
export class ThemeToggle {
  protected readonly layout = inject(LayoutService);
}
