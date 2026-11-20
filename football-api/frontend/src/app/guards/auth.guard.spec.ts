import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('redirige a /login sin sesión', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('deja pasar con sesión', () => {
    localStorage.setItem('fifa_access_token', 'abc');
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result).toBeTrue();
  });
});
