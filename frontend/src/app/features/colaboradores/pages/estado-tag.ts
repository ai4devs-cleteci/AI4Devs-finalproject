import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { ESTADO_LABELS, EstadoColaborador } from '../data/colaborador.model';

/** Estado contractual con el color correspondiente. */
@Component({
  selector: 'app-estado-tag',
  imports: [Tag],
  template: `<p-tag [value]="label()" [severity]="severity()" />`,
})
export class EstadoTag {
  readonly estado = input.required<EstadoColaborador>();

  protected readonly label = computed(() => ESTADO_LABELS[this.estado()]);
  protected readonly severity = computed(() => {
    switch (this.estado()) {
      case 'ACTIVO':
        return 'success';
      case 'EGRESADO':
        return 'secondary';
      default:
        return 'info';
    }
  });
}
