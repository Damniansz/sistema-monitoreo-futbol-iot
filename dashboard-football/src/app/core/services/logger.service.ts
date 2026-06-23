import { Injectable, isDevMode } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLevel: LogLevel = isDevMode() ? LogLevel.DEBUG : LogLevel.INFO;

  debug(message: string, ...optionalParams: any[]) {
    this.log(LogLevel.DEBUG, message, optionalParams);
  }

  info(message: string, ...optionalParams: any[]) {
    this.log(LogLevel.INFO, message, optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    this.log(LogLevel.WARN, message, optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    this.log(LogLevel.ERROR, message, optionalParams);
  }

  private log(level: LogLevel, message: string, optionalParams: any[]) {
    if (level >= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${LogLevel[level]}] ${timestamp}:`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, ...optionalParams);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, ...optionalParams);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...optionalParams);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, ...optionalParams);
          break;
      }
    }
  }
}
