import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'fifa_access_token';

interface LoginResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );

  readonly loggedIn = computed(() => this.tokenSignal() !== null);

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, {
        username,
        password,
      })
      .pipe(
        tap((res) => this.saveToken(res.accessToken)),
        map(() => undefined),
      );
  }

  token(): string | null {
    return this.tokenSignal();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }

  private saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }
}
