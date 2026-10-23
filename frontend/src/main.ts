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
  // Sin arranque no hay tokens de PrimeNG: se usan colores de la paleta de Tailwind.
  main.className =
    'grid min-h-svh place-items-center bg-white p-6 text-center text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100';
  main.innerHTML = `
    <div role="alert" class="max-w-md space-y-4">
      <h1 class="text-xl font-semibold">No se pudo iniciar sesión</h1>
      <p>El servicio de autenticación no está disponible en este momento. Inténtalo de nuevo en unos minutos.</p>
      <button type="button" class="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Reintentar</button>
    </div>`;
  main.querySelector('button')?.addEventListener('click', () => location.reload());
  document.body.replaceChildren(main);
}
