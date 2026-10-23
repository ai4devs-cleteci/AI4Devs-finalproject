import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal } from '@angular/core';

const DESKTOP_QUERY = '(min-width: 1024px)';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
export const SIDEBAR_STORAGE_KEY = 'hris.sidebar.open';
export const THEME_STORAGE_KEY = 'hris.theme';

/**
 * Estado del layout compartido por el shell: breakpoint, apertura del sidebar y tema.
 * Las preferencias se guardan en localStorage; si no está disponible se usan los valores por defecto.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  /** `true` en viewports de 1024 px o más. Sin `matchMedia` se asume escritorio. */
  readonly isDesktop = signal(this.matches(DESKTOP_QUERY) ?? true);

  /** Expandido/colapsado en escritorio; persistido entre recargas. */
  readonly desktopSidebarOpen = signal(this.read(SIDEBAR_STORAGE_KEY) !== 'false');

  /** Overlay abierto en pantallas estrechas; siempre arranca cerrado y no se persiste. */
  readonly mobileSidebarOpen = signal(false);

  readonly darkMode = signal(this.initialDarkMode());

  constructor() {
    const query = this.window?.matchMedia?.(DESKTOP_QUERY);
    if (query) {
      const listener = (event: MediaQueryListEvent) => {
        this.isDesktop.set(event.matches);
        this.mobileSidebarOpen.set(false);
      };
      query.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', listener));
    }

    effect(() => this.write(SIDEBAR_STORAGE_KEY, String(this.desktopSidebarOpen())));
    effect(() => this.document.documentElement.classList.toggle('dark', this.darkMode()));
  }

  /** Cambia el tema y guarda la elección explícita del usuario. */
  toggleDarkMode(): void {
    const dark = !this.darkMode();
    this.darkMode.set(dark);
    this.write(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  }

  private initialDarkMode(): boolean {
    const stored = this.read(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored === 'dark';
    }
    return this.matches(DARK_SCHEME_QUERY) ?? false;
  }

  private matches(query: string): boolean | undefined {
    return this.window?.matchMedia?.(query).matches;
  }

  private read(key: string): string | null {
    try {
      return this.window?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.window?.localStorage.setItem(key, value);
    } catch {
      // Almacenamiento bloqueado: la preferencia solo dura la sesión actual.
    }
  }
}
