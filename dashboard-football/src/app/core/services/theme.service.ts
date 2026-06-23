import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor() {
    // Verifica el tema guardado o usa el claro por defecto (para el esquema de colores claros solicitado)
    const saved = localStorage.getItem('theme') as Theme;
    if (saved === 'dark' || saved === 'light') {
      this.theme.set(saved);
    } else {
      this.theme.set('light');
    }

    // Actualiza de forma reactiva la lista de clases en el documento raíz
    effect(() => {
      const current = this.theme();
      const root = window.document.documentElement;
      if (current === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      localStorage.setItem('theme', current);
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
