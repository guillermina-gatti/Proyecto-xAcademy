import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
    let service: AuthService;
    let ctrl: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(AuthService);
        ctrl = TestBed.inject(HttpTestingController);
    });

    afterEach(() => ctrl.verify());

    it('guarda el token al iniciar sesión', () => {
        service.login('admin', 'clave').subscribe();

        const req = ctrl.expectOne(`${environment.apiUrl}/api/auth/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ username: 'admin', password: 'clave' });
        req.flush({ accessToken: 'abc' });

        expect(service.token()).toBe('abc');
        expect(service.loggedIn()).toBeTrue();
        expect(localStorage.getItem('fifa_access_token')).toBe('abc');
    });

    it('logout borra el token y cierra la sesión', () => {
        localStorage.setItem('fifa_access_token', 'abc');
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        const fresh = TestBed.inject(AuthService);
        expect(fresh.loggedIn()).toBeTrue();

        fresh.logout();

        expect(fresh.loggedIn()).toBeFalse();
        expect(localStorage.getItem('fifa_access_token')).toBeNull();
    });

});
