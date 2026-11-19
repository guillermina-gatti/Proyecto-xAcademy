import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let navigateByUrl: jasmine.Spy;
  const api = environment.apiUrl;

  beforeEach(() => {
    localStorage.clear();
    navigateByUrl = jasmine.createSpy('navigateByUrl');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('agrega el header Authorization a las llamadas a la API', () => {
    localStorage.setItem('fifa_access_token', 'abc');

    http.get(`${api}/api/players`).subscribe();

    const req = ctrl.expectOne(`${api}/api/players`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('no agrega el header al login', () => {
    localStorage.setItem('fifa_access_token', 'abc');

    http.post(`${api}/api/auth/login`, {}).subscribe();

    const req = ctrl.expectOne(`${api}/api/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ accessToken: 'nuevo' });
  });

  it('ante un 401 de la API cierra la sesión y redirige a /login', () => {
    localStorage.setItem('fifa_access_token', 'abc');

    http.get(`${api}/api/players`).subscribe({ error: () => {} });

    ctrl
      .expectOne(`${api}/api/players`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('fifa_access_token')).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
