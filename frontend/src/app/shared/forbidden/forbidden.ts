import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideShieldX } from '@lucide/angular';

/** Destino de `requireRole` cuando el usuario no tiene un rol con acceso a la página pedida. */
@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, LucideShieldX],
  template: `
    <section class="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <svg
        lucideShieldX
        [size]="48"
        class="text-primary-700 dark:text-primary-400"
        aria-hidden="true"
      ></svg>
      <h1 class="text-2xl font-semibold">No tienes acceso</h1>
      <p class="text-muted-color">
        Tu rol no tiene permiso para esta página o acción. Si crees que deberías tenerlo, contacta
        con People &amp; Talent.
      </p>
      <a
        routerLink="/inicio"
        class="font-medium text-primary-700 underline underline-offset-4 dark:text-primary-300"
      >
        Volver a Inicio
      </a>
    </section>
  `,
})
export class Forbidden {}
