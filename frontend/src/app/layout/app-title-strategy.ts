import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const APP_NAME = 'HRIS Cleteci';

/** Fija `document.title` como "<sección> · HRIS Cleteci" y expone la sección activa para la barra superior. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly sectionTitle = signal<string | undefined>(undefined);

  readonly current = this.sectionTitle.asReadonly();

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const section = this.buildTitle(snapshot);
    this.sectionTitle.set(section);
    this.title.setTitle(section ? `${section} · ${APP_NAME}` : APP_NAME);
  }
}
