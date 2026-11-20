import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PlayerComponent } from './player';
import { Player } from '../../services/player/player';
import { environment } from '../../../environments/environment';

describe('PlayerComponent', () => {
  const url = `${environment.apiUrl}/api/players/1`;
  const player: Player = {
    id: 1,
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

  let fixture: ComponentFixture<PlayerComponent>;
  let ctrl: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(convertToParamMap({ id: '1' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerComponent);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('muestra el jugador y dibuja el radar', () => {
    ctrl.expectOne(url).flush(player);
    fixture.detectChanges();

    expect(fixture.componentInstance.player()?.speed).toBe(85);
    expect(fixture.nativeElement.textContent).toContain('Lionel Messi');
    expect(fixture.nativeElement.querySelector('canvas')).not.toBeNull();
  });

  it('con un id inexistente muestra el error y no dibuja el radar', () => {
    ctrl
      .expectOne(url)
      .flush({ message: 'x' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toContain('no encontrado');
    expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
  });
});
