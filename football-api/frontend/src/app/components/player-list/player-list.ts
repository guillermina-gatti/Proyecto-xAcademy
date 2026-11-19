import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import {
  PlayerGender,
  PlayerListItem,
  PlayerListMeta,
  PlayerSearchFilters,
  PlayerService,
} from '../../services/player/player';

const PAGE_SIZE = 20;

const clean = (value: string): string | null => value.trim() || null;

@Component({
  selector: 'app-player-list',
  imports: [ReactiveFormsModule],
  templateUrl: './player-list.html',
  styleUrl: './player-list.css',
})
export class PlayerListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PlayerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly versions = Array.from({ length: 9 }, (_, i) => 15 + i);
  readonly genders: { value: PlayerGender | ''; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'not_specified', label: 'Prefiero no decirlo' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: '',
    club: '',
    position: '',
    nationality: '',
    gender: '' as PlayerGender | '',
    fifaVersion: '',
  });

  readonly rows = signal<PlayerListItem[]>([]);
  readonly meta = signal<PlayerListMeta | null>(null);
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        tap((params) => {
          this.syncForm(params);
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap((params) =>
          this.service
            .list(this.filtersFrom(params), this.pageFrom(params), PAGE_SIZE)
            .pipe(
              catchError((err: unknown) => {
                this.errorMessage.set(this.messageFor(err));
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        this.rows.set(res?.data ?? []);
        this.meta.set(res?.meta ?? null);
      });
  }

  applyFilters(): void {
    const v = this.form.getRawValue();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        name: clean(v.name),
        club: clean(v.club),
        position: clean(v.position),
        nationality: clean(v.nationality),
        gender: v.gender || null,
        fifaVersion: v.fifaVersion || null,
        page: null, // al cambiar filtros se vuelve a la página 1
      },
    });
  }

  clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  goToPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  downloadCsv(): void {
    this.downloading.set(true);
    this.errorMessage.set(null);
    const filters = this.filtersFrom(this.route.snapshot.queryParamMap);
    this.service.exportCsv(filters).subscribe({
      next: (blob) => {
        this.downloading.set(false);
        this.saveBlob(blob, 'players.csv');
      },
      error: (err: unknown) => {
        this.downloading.set(false);
        this.errorMessage.set(this.messageFor(err));
      },
    });
  }

  private filtersFrom(params: ParamMap): PlayerSearchFilters {
    const version = Number(params.get('fifaVersion'));
    return {
      name: params.get('name') || undefined,
      club: params.get('club') || undefined,
      position: params.get('position') || undefined,
      nationality: params.get('nationality') || undefined,
      gender: (params.get('gender') as PlayerGender) || undefined,
      fifaVersion: version > 0 ? version : undefined,
    };
  }

  private pageFrom(params: ParamMap): number {
    const page = Number(params.get('page'));
    return Number.isInteger(page) && page >= 1 ? page : 1;
  }

  private syncForm(params: ParamMap): void {
    this.form.patchValue(
      {
        name: params.get('name') ?? '',
        club: params.get('club') ?? '',
        position: params.get('position') ?? '',
        nationality: params.get('nationality') ?? '',
        gender: (params.get('gender') ?? '') as PlayerGender | '',
        fifaVersion: params.get('fifaVersion') ?? '',
      },
      { emitEvent: false },
    );
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private messageFor(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No se pudo conectar con la API';
      if (err.status === 400) return '400 · Revisá los filtros';
      return `${err.status} · No se pudieron completar los datos`;
    }
    return 'Error inesperado';
  }
}
