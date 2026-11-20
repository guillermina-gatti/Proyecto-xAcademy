import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Chart,
  ChartConfiguration,
  Filler,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Player, PlayerService } from '../../services/player/player';

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const SKILL_LABELS = ['Velocidad', 'Tiro', 'Pase', 'Regate', 'Defensa', 'Físico'];

function skillsOf(p: Player): number[] {
  return [p.speed, p.shooting, p.passing, p.dribbling, p.defending, p.physic];
}

// Colores del diseño (#86d99a y verde oscuro del botón), fijados aquí porque
// Chart.js no lee las variables CSS.
function radarConfig(data: number[]): ChartConfiguration<'radar'> {
  return {
    type: 'radar',
    data: {
      labels: SKILL_LABELS,
      datasets: [
        {
          label: 'Skills',
          data,
          borderColor: '#86d99a',
          backgroundColor: 'rgba(134, 217, 154, 0.25)',
          pointBackgroundColor: '#163a1f',
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { r: { min: 0, max: 99, ticks: { stepSize: 20 } } },
    },
  };
}

@Component({
  selector: 'app-player',
  imports: [RouterLink],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class PlayerComponent implements OnDestroy {
  private readonly service = inject(PlayerService);
  private readonly route = inject(ActivatedRoute);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('radar');
  private chart: Chart<'radar'> | null = null;

  readonly player = signal<Player | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap((params) =>
          this.service.getPlayer(Number(params.get('id'))).pipe(
            map((player) => ({ player, error: null as string | null })),
            catchError((err: unknown) =>
              of({ player: null, error: this.messageFor(err) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        this.player.set(res.player);
        this.errorMessage.set(res.error);
      });

    // El efecto corre después de renderizar, así que el canvas ya existe.
    effect(() => {
      const p = this.player();
      const canvas = this.canvas()?.nativeElement;
      if (!p || !canvas) {
        this.destroyChart();
        return;
      }
      if (this.chart && this.chart.canvas === canvas) {
        this.chart.data.datasets[0].data = skillsOf(p);
        this.chart.update();
      } else {
        this.destroyChart();
        this.chart = new Chart(canvas, radarConfig(skillsOf(p)));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private messageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No se pudo conectar con la API';
      if (err.status === 404) return 'Jugador no encontrado';
      if (err.status === 400) return 'ID de jugador inválido';
      return `${err.status} · No se pudo cargar el jugador`;
    }
    return 'Error inesperado';
  }
}
