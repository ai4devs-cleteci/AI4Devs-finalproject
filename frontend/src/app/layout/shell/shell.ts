import {
  Component,
  DOCUMENT,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon, LucideLogOut, LucidePanelLeft } from '@lucide/angular';
import { MenuItem } from 'primeng/api';
import { ButtonDirective, ButtonIcon } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS, primaryRole } from '../../core/auth/roles';
import { APP_NAME, AppTitleStrategy } from '../app-title-strategy';
import { LayoutService } from '../layout.service';
import { NAVIGATION } from '../navigation';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

/** Layout común de la aplicación: navegación lateral, barra superior y área de contenido. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SidebarModule,
    TooltipModule,
    MenuModule,
    ButtonDirective,
    ButtonIcon,
    LucideDynamicIcon,
    LucideLogOut,
    LucidePanelLeft,
    ThemeToggle,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  host: {
    '(document:keydown.escape)': 'closeOverlay()',
  },
})
export class Shell {
  private readonly layout = inject(LayoutService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthService);

  protected readonly appName = APP_NAME;
  protected readonly navigation = NAVIGATION;
  protected readonly section = inject(AppTitleStrategy).current;
  protected readonly isDesktop = this.layout.isDesktop;

  /** Escritorio: expandido/colapsado persistido. Móvil: overlay, cerrado por defecto. */
  protected readonly open = computed(() =>
    this.isDesktop() ? this.layout.desktopSidebarOpen() : this.layout.mobileSidebarOpen(),
  );

  /** Los tooltips solo aportan cuando el menú muestra únicamente iconos. */
  protected readonly showTooltips = computed(
    () => this.isDesktop() && !this.layout.desktopSidebarOpen(),
  );

  protected readonly user = this.auth.user;

  /** Iniciales de las dos primeras palabras del nombre, para el avatar. */
  protected readonly initials = computed(() =>
    (this.user()?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(''),
  );

  protected readonly roleLabel = computed(() => {
    const role = primaryRole(this.user()?.roles ?? []);
    return role ? ROLE_LABELS[role] : null;
  });

  protected readonly userMenuOpen = signal(false);
  protected readonly userMenuItems: MenuItem[] = [
    { label: 'Cerrar sesión', command: () => void this.auth.logout() },
  ];

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.layout.mobileSidebarOpen.set(false));
  }

  protected setOpen(open: boolean): void {
    if (this.isDesktop()) {
      this.layout.desktopSidebarOpen.set(open);
      return;
    }
    this.layout.mobileSidebarOpen.set(open);
    if (open) {
      // El overlay queda antes del trigger en el DOM: se lleva el foco al menú para poder recorrerlo.
      afterNextRender(() => this.focus('nav a[aria-current="page"]', 'nav a'), {
        injector: this.injector,
      });
    } else if (this.document.querySelector('p-sidebar')?.contains(this.document.activeElement)) {
      // El panel sale de pantalla: el foco vuelve al trigger en lugar de perderse.
      this.focus('[pSidebarTrigger]');
    }
  }

  /** El Sidebar solo atiende Escape con el foco dentro de él; aquí se cubre el foco en la barra superior. */
  protected closeOverlay(): void {
    if (!this.isDesktop() && this.layout.mobileSidebarOpen()) {
      this.setOpen(false);
    }
  }

  /** El `<base href>` haría que `#contenido` navegase a la raíz: se enfoca el contenido sin navegar. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.focus('#contenido');
  }

  /** Enfoca el primer elemento que exista según el orden de preferencia de los selectores. */
  private focus(...selectors: string[]): void {
    const target = selectors
      .map((selector) => this.document.querySelector<HTMLElement>(selector))
      .find((element) => element !== null);
    target?.focus();
  }
}
