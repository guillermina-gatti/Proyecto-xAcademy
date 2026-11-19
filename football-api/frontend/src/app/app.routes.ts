import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'players',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/player-list/player-list').then(
        (m) => m.PlayerListComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'players' },
  { path: '**', redirectTo: 'players' },
];
