import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <p class="text-5xl font-bold text-primary-700 dark:text-primary-400" aria-hidden="true">
        404
      </p>
      <h1 class="text-2xl font-semibold">Página no encontrada</h1>
      <p class="text-muted-color">La dirección que has abierto no existe o ha cambiado.</p>
      <a
        routerLink="/inicio"
        class="font-medium text-primary-700 underline underline-offset-4 dark:text-primary-300"
      >
        Volver a Inicio
      </a>
    </section>
  `,
})
export class NotFound {}
