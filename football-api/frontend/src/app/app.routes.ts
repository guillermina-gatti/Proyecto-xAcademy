import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then((m) => m.LoginComponent),
  },
  {
    // Temporal: se reemplaza por el listado en el commit 12.
    path: 'players',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/player/player').then((m) => m.PlayerComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'players' },
  { path: '**', redirectTo: 'players' },
];
