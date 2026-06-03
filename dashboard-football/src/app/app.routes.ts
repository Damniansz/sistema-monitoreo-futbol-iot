import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login)
  },

  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/main-layout/main-layout')
        .then(m => m.MainLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-home/dashboard-home')
            .then(m => m.DashboardHome)
      },

      {
        path: 'player/:id',
        loadComponent: () =>
          import('./features/player/player-detail/player-detail')
            .then(m => m.PlayerDetail)
      },

      {
        path: 'session',
        loadComponent: () =>
          import('./features/session/live-session/live-session')
            .then(m => m.LiveSession)
      },

      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history-list/history-list')
            .then(m => m.HistoryList)
      },

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];