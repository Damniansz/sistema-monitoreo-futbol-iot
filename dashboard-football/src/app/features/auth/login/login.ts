import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
})
export class Login {
  protected readonly themeService = inject(ThemeService);

  constructor(private router: Router) {}

  login(): void {
    this.router.navigate(['/dashboard']);
  }
}