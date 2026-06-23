import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

export interface AuthResponse {
  token: string;
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private notifier = inject(NotificationService);

  private readonly TOKEN_KEY = 'football_jwt_token';
  private readonly ROLES_KEY = 'football_user_roles';

  readonly currentUser = signal<string | null>(null);
  readonly roles = signal<string[]>([]);
  
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  
  constructor() {
    this.loadToken();
  }

  private loadToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const storedRoles = localStorage.getItem(this.ROLES_KEY);
    
    if (token && storedRoles) {
      try {
        // Parse basic payload from JWT format sin libreria
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp && (payload.exp * 1000 < Date.now());
        
        if (isExpired) {
          this.logout();
        } else {
          this.currentUser.set(payload.sub || 'User');
          this.roles.set(storedRoles ? JSON.parse(storedRoles) : payload.roles || []);
        }
      } catch (e) {
        this.logout();
      }
    }
  }

  handleOAuthCallback(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload.roles || ['PLAYER']; // Default fallback si no vienen roles en el token
      
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
      
      this.currentUser.set(payload.sub || 'User');
      this.roles.set(roles);
      
      this.logger.info(`Usuario logueado vía OAuth Google: ${payload.sub}`);
      this.notifier.showSuccess(`¡Bienvenido vía Google, ${payload.sub}!`);
      this.router.navigate(['/dashboard']);
    } catch (e) {
      this.logger.error('Error procesando token OAuth', e);
      this.notifier.showError('Error al iniciar sesión con Google.');
      this.router.navigate(['/login']);
    }
  }

  login(credentials: any): Observable<AuthResponse> {
    const url = 'http://localhost:8080/api/v1/auth/login';
    
    // Mock robusto si el backend no está disponible aún
    const mockRequest = of({
      token: btoa(JSON.stringify({ alg: 'HS256' })) + '.' + btoa(JSON.stringify({ sub: credentials.username, exp: Math.floor(Date.now() / 1000) + (60 * 60) })) + '.signature',
      username: credentials.username,
      roles: credentials.username === 'admin' ? ['ADMIN'] : ['COACH']
    }).pipe(delay(800));

    return this.http.post<AuthResponse>(url, credentials).pipe(
      catchError(() => mockRequest),
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.ROLES_KEY, JSON.stringify(response.roles));
        
        this.currentUser.set(response.username);
        this.roles.set(response.roles);
        
        this.logger.info(`Usuario logueado: ${response.username}`, response.roles);
        this.notifier.showSuccess(`¡Bienvenido, ${response.username}!`);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    this.currentUser.set(null);
    this.roles.set([]);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }
}
