import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PlayerListComponent } from './player-list';
import { PlayerListResponse } from '../../services/player/player';
import { environment } from '../../../environments/environment';

describe('PlayerListComponent', () => {
  const listUrl = `${environment.apiUrl}/api/players`;
  const response: PlayerListResponse = {
    data: [
      {
        id: 1,
        name: 'Lionel Messi',
        club: 'FC Barcelona',
        position: 'RW',
        nationality: 'Argentina',
        rating: 93,
      },
    ],
    meta: { page: 2, limit: 20, total: 21, totalPages: 2 },
  };

  let fixture: ComponentFixture<PlayerListComponent>;
  let ctrl: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    const params = convertToParamMap({ name: 'Messi', page: '2' });
    await TestBed.configureTestingModule({
      imports: [PlayerListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: new BehaviorSubject(params),
            snapshot: { queryParamMap: params },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerListComponent);
    ctrl = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => ctrl.verify());

  it('carga el listado con los filtros y la página de la URL', () => {
    const req = ctrl.expectOne((r) => r.url === listUrl);
    expect(req.request.params.get('name')).toBe('Messi');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');

    req.flush(response);

    expect(fixture.componentInstance.rows().length).toBe(1);
    expect(fixture.componentInstance.meta()?.total).toBe(21);
  });

  it('aplicar filtros navega con los valores y vuelve a la página 1', () => {
    ctrl.expectOne((r) => r.url === listUrl).flush(response);
    const navigate = spyOn(router, 'navigate');

    fixture.componentInstance.form.patchValue({
      club: '  FC Barcelona ',
      gender: 'male',
    });
    fixture.componentInstance.applyFilters();

    expect(navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          club: 'FC Barcelona',
          gender: 'male',
          page: null,
        }),
      }),
    );
  });

  it('muestra el error de la API y no muestra filas', () => {
    ctrl
      .expectOne((r) => r.url === listUrl)
      .flush(
        { message: 'x' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toContain('400');
    expect(fixture.componentInstance.rows().length).toBe(0);
  });
});
