import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { PlayerFormComponent } from './player-form';
import { Player } from '../../services/player/player';
import { environment } from '../../../environments/environment';

const api = `${environment.apiUrl}/api/players`;

const existing: Player = {
  id: 5,
  name: 'Lionel Messi',
  club: 'FC Barcelona',
  position: 'RW',
  nationality: 'Argentina',
  rating: 93,
  potential: 93,
  age: 31,
  fifaVersion: 23,
  speed: 85,
  shooting: 92,
  passing: 91,
  dribbling: 95,
  defending: 34,
  physic: 65,
};

function create(id: string | null) {
  TestBed.configureTestingModule({
    imports: [PlayerFormComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(id === null ? {} : { id }),
          },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(PlayerFormComponent);
  return {
    fixture,
    component: fixture.componentInstance,
    ctrl: TestBed.inject(HttpTestingController),
    router: TestBed.inject(Router),
  };
}

describe('PlayerFormComponent', () => {
  let ctrl: HttpTestingController;

  afterEach(() => ctrl?.verify());

  describe('alta', () => {
    it('no envía nada si el formulario está vacío', () => {
      const env = create(null);
      ctrl = env.ctrl;

      env.component.submit();

      ctrl.expectNone(api);
      expect(env.component.form.invalid).toBeTrue();
    });

    it('crea el jugador y navega a su detalle', () => {
      const env = create(null);
      ctrl = env.ctrl;
      const c = env.component;
      spyOn(env.router, 'navigate').and.returnValue(Promise.resolve(true));

      c.form.patchValue({ name: 'Nuevo', position: 'CM', rating: 80, speed: 70 });
      c.submit();

      const req = ctrl.expectOne(api);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Nuevo',
        position: 'CM',
        rating: 80,
        gender: 'not_specified',
        speed: 70,
      });
      req.flush({ ...existing, id: 321 }, { status: 201, statusText: 'Created' });

      expect(env.router.navigate).toHaveBeenCalledWith(['/players', 321]);
    });

    it('muestra los errores 400 del backend', () => {
      const env = create(null);
      ctrl = env.ctrl;
      const c = env.component;

      c.form.patchValue({ name: 'Nuevo', position: 'CM', rating: 80 });
      c.submit();

      ctrl
        .expectOne(api)
        .flush(
          { message: ['name should not be empty'] },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(c.errorMessage()).toContain('name should not be empty');
      expect(c.submitting()).toBeFalse();
    });
  });

  describe('edición', () => {
    it('carga los valores actuales y envía un PATCH sin género', () => {
      const env = create('5');
      ctrl = env.ctrl;
      const c = env.component;
      spyOn(env.router, 'navigate').and.returnValue(Promise.resolve(true));

      ctrl.expectOne(`${api}/5`).flush(existing);
      expect(c.form.getRawValue().name).toBe('Lionel Messi');

      c.form.patchValue({ rating: 90 });
      c.submit();

      const req = ctrl.expectOne(`${api}/5`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.gender).toBeUndefined();
      expect(req.request.body.club).toBe('FC Barcelona');
      req.flush({ ...existing, rating: 90 });

      expect(env.router.navigate).toHaveBeenCalledWith(['/players', 5]);
    });
  });
});
