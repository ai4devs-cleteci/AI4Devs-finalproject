import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideConstruction } from '@lucide/angular';

/** Página provisional para los módulos que aún no existen; muestra el título de la ruta. */
@Component({
  selector: 'app-under-construction',
  imports: [LucideConstruction],
  template: `
    <section class="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
      <svg
        lucideConstruction
        [size]="48"
        class="text-primary-700 dark:text-primary-400"
        aria-hidden="true"
      ></svg>
      <h1 class="text-2xl font-semibold">{{ module }} está en construcción</h1>
      <p class="text-muted-color">Este módulo todavía no está disponible.</p>
    </section>
  `,
})
export class UnderConstruction {
  protected readonly module = inject(ActivatedRoute).snapshot.title ?? 'Este módulo';
}
