import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PlayerService } from './player';
import { environment } from '../../../environments/environment';

describe('PlayerService', () => {
  const api = environment.apiUrl;
  let service: PlayerService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlayerService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('envía los filtros y la paginación del listado', () => {
    service.list({ name: 'Messi', gender: 'male' }, 2, 20).subscribe();

    const req = ctrl.expectOne((r) => r.url === `${api}/api/players`);
    expect(req.request.params.get('name')).toBe('Messi');
    expect(req.request.params.get('gender')).toBe('male');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.has('club')).toBeFalse();

    req.flush({ data: [], meta: { page: 2, limit: 20, total: 0, totalPages: 0 } });
  });

  it('omite los filtros vacíos', () => {
    service.list({ name: '', club: undefined }, 1, 20).subscribe();

    const req = ctrl.expectOne((r) => r.url === `${api}/api/players`);
    expect(req.request.params.has('name')).toBeFalse();
    expect(req.request.params.has('club')).toBeFalse();

    req.flush({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  });

  it('pide el CSV como blob y sin paginación', () => {
    service.exportCsv({ club: 'FC Barcelona' }).subscribe();

    const req = ctrl.expectOne((r) => r.url === `${api}/api/players/export.csv`);
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('club')).toBe('FC Barcelona');
    expect(req.request.params.has('page')).toBeFalse();

    req.flush(new Blob(['id,name']));
  });

  it('pide el detalle por id', () => {
    service.getPlayer(1).subscribe();

    const req = ctrl.expectOne(`${api}/api/players/1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
