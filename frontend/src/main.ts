import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  showStartupError();
});

/**
 * Sin sesión no se puede montar el shell (Keycloak caído, issuer mal configurado…): se avisa
 * con HTML plano, sin depender de Angular ni de PrimeNG, en lugar de dejar la página en blanco.
 */
function showStartupError(): void {
  const main = document.createElement('main');
  // Sin arranque no hay tokens de PrimeNG: se usan colores de Tailwind y el azul `cleteci-*` de styles.css.
  main.className =
    'grid min-h-svh place-items-center bg-white p-6 text-center text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100';
  main.innerHTML = `
    <div role="alert" class="max-w-md space-y-4">
      <h1 class="text-xl font-semibold">No se pudo iniciar sesión</h1>
      <p>El servicio de autenticación no está disponible en este momento. Inténtalo de nuevo en unos minutos.</p>
      <button type="button" class="rounded-md bg-cleteci-600 px-4 py-2 font-medium text-white hover:bg-cleteci-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cleteci-600 dark:focus-visible:outline-cleteci-400">Reintentar</button>
    </div>`;
  main.querySelector('button')?.addEventListener('click', () => location.reload());
  document.body.replaceChildren(main);
}
