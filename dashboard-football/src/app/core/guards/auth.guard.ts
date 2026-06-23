import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notifier = inject(NotificationService);

  if (authService.isLoggedIn()) {
    return true;
  }

  notifier.showError('Acceso denegado. Inicia sesión primero.');
  return router.createUrlTree(['/login']);
};
