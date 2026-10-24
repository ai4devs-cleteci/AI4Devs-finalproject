import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { provideAuth } from './core/auth/auth.config';
import { CleteciPreset } from './core/theme/cleteci-preset';
import { AppTitleStrategy } from './layout/app-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAuth(),
    provideRouter(routes),
    { provide: TitleStrategy, useExisting: AppTitleStrategy },
    providePrimeNG({
      theme: {
        preset: CleteciPreset,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
  ],
};
