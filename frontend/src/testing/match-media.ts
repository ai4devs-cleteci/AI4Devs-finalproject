/**
 * Sustituto de `window.matchMedia` para jsdom, que no lo implementa.
 * Resuelve el breakpoint de escritorio y `prefers-color-scheme` y permite simular cambios de viewport.
 */
export interface MatchMediaController {
  setDesktop(desktop: boolean): void;
  restore(): void;
}

export function installMatchMedia(options: {
  desktop: boolean;
  dark?: boolean;
}): MatchMediaController {
  const state = { desktop: options.desktop, dark: options.dark ?? false };
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  const evaluate = (query: string): boolean => {
    if (query.includes('min-width')) return state.desktop;
    if (query.includes('prefers-color-scheme: dark')) return state.dark;
    return false;
  };

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      media: query,
      get matches() {
        return evaluate(query);
      },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (query.includes('min-width')) listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    }),
  });

  return {
    setDesktop(desktop: boolean) {
      state.desktop = desktop;
      listeners.forEach((listener) => listener({ matches: desktop } as MediaQueryListEvent));
    },
    restore() {
      if (original) {
        Object.defineProperty(window, 'matchMedia', original);
      } else {
        Reflect.deleteProperty(window, 'matchMedia');
      }
    },
  };
}
