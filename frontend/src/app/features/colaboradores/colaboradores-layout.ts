import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

/** Contenedor de la feature: los avisos sobreviven al navegar entre páginas. */
@Component({
  selector: 'app-colaboradores-layout',
  imports: [RouterOutlet, Toast],
  template: `
    <router-outlet />
    <p-toast position="top-right" />
  `,
})
export class ColaboradoresLayout {}
