import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notifier = inject(NotificationService);
  
  const expectedRoles = route.data?.['roles'] as Array<string>;

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  const hasAccess = expectedRoles.some(role => authService.hasRole(role));

  if (hasAccess) {
    return true;
  }

  notifier.showError('No tienes permisos suficientes para acceder a esta área.');
  return router.createUrlTree(['/dashboard']);
};
