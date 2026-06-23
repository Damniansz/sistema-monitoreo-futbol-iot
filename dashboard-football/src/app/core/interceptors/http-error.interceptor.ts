import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const notifier = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error del cliente: ${error.error.message}`;
        logger.error(errorMessage, error.error);
      } else {
        // Error del lado del servidor
        errorMessage = `Error del servidor (Código ${error.status}): ${error.message}`;
        logger.error(`Error HTTP ${error.status} en la ruta ${req.url}`, error.error);
      }

      // Notificación amigable al usuario
      notifier.showError('Hubo un problema de comunicación con el servidor. Revisa tu conexión.');

      return throwError(() => new Error(errorMessage));
    })
  );
};
