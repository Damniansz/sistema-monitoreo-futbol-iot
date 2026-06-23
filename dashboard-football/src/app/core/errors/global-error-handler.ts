import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector, private zone: NgZone) {}

  handleError(error: any): void {
    // Obtenemos los servicios usando Injector para evitar dependencias circulares
    const logger = this.injector.get(LoggerService);
    const notifier = this.injector.get(NotificationService);

    let errorMessage = 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.';

    if (error instanceof HttpErrorResponse) {
      errorMessage = `Error de conexión: ${error.message}`;
    } else if (error instanceof TypeError) {
      errorMessage = 'Error de formato en la aplicación.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Usamos NgZone para asegurar que la actualización del signal/UI ocurra dentro de Angular context
    this.zone.run(() => {
      notifier.showError(errorMessage);
    });

    logger.error('Error no controlado interceptado por GlobalErrorHandler:', error);
  }
}
