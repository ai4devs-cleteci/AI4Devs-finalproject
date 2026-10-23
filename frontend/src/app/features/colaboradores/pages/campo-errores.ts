import { Component, computed, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

/**
 * Errores de un campo. Cuándo mostrarlos lo decide el formulario (`visible`); el control los
 * referencia con `aria-describedby` (o `aria-labelledby` en los `p-select`).
 */
@Component({
  selector: 'app-campo-errores',
  template: `
    @if (visibles().length) {
      <p [id]="errorId()" class="text-sm text-red-700 dark:text-red-300">
        @for (error of visibles(); track $index) {
          <span class="block">{{ error }}</span>
        }
      </p>
    }
  `,
})
export class CampoErrores {
  readonly errorId = input.required<string>();
  readonly estado = input.required<FieldState<unknown>>();
  readonly visible = input.required<boolean>();

  readonly visibles = computed(() =>
    this.visible()
      ? this.estado()
          .errors()
          .map((error) => error.message ?? 'El valor no es válido.')
      : [],
  );
}
