import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  authService = inject(AuthService);

  readonly isStaff = computed(() => {
    return this.authService.hasRole('ADMIN') || 
           this.authService.hasRole('COACH') || 
           this.authService.hasRole('ANALYST');
  });

  logout() {
    this.authService.logout();
  }
}
