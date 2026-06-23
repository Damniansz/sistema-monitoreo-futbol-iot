import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // En un caso real, esto se conectaría a un componente UI de Toast.
  // Por ahora mantenemos el estado y usamos console para fallback si no hay UI.
  readonly activeNotification = signal<AppNotification | null>(null);

  show(notification: AppNotification) {
    this.activeNotification.set(notification);
    
    // Fallback console log de la notificación amigable
    if (notification.type === 'error') {
      console.error(`[Notificación UI] ${notification.message}`);
    } else {
      console.log(`[Notificación UI] ${notification.message}`);
    }

    setTimeout(() => {
      this.clear();
    }, notification.duration || 5000);
  }

  showError(message: string) {
    this.show({ message, type: 'error', duration: 7000 });
  }

  showSuccess(message: string) {
    this.show({ message, type: 'success', duration: 4000 });
  }

  clear() {
    this.activeNotification.set(null);
  }
}
