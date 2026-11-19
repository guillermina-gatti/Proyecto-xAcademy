import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login';
import { environment } from '../../../environments/environment';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let ctrl: HttpTestingController;
  let router: Router;
  const loginUrl = `${environment.apiUrl}/api/auth/login`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    ctrl = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => ctrl.verify());

  it('no envía la petición si el formulario está vacío', () => {
    fixture.componentInstance.submit();
    ctrl.expectNone(loginUrl);
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });

  it('muestra el error 401 de la API y no navega', () => {
    spyOn(router, 'navigateByUrl');
    fixture.componentInstance.form.setValue({
      username: 'admin',
      password: 'mal',
    });

    fixture.componentInstance.submit();
    ctrl
      .expectOne(loginUrl)
      .flush({ message: 'x' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toContain('401');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.componentInstance.submitting()).toBeFalse();
  });

  it('con credenciales válidas navega a /players', () => {
    spyOn(router, 'navigateByUrl');
    fixture.componentInstance.form.setValue({
      username: 'admin',
      password: 'clave',
    });

    fixture.componentInstance.submit();
    ctrl.expectOne(loginUrl).flush({ accessToken: 'abc' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/players');
  });
});
