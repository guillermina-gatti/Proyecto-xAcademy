import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PlayerGender,
  PlayerInput,
  PlayerService,
} from '../../services/player/player';

type SkillKey =
  | 'speed'
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'defending'
  | 'physic';

// Mismo rango que el backend: enteros entre 0 y 99. Vacío no es error aquí;
// lo obligatorio se valida con Validators.required.
const integerInRange =
  (min: number, max: number): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '') return null;
    return Number.isInteger(value) && value >= min && value <= max
      ? null
      : { range: { min, max } };
  };

@Component({
  selector: 'app-player-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './player-form.html',
  styleUrl: './player-form.css',
})
export class PlayerFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PlayerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly playerId: number | null;
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly genders: { value: PlayerGender; label: string }[] = [
    { value: 'not_specified', label: 'Prefiero no decirlo' },
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
  ];

  readonly skillFields: { key: SkillKey; label: string }[] = [
    { key: 'speed', label: 'Velocidad' },
    { key: 'shooting', label: 'Tiro' },
    { key: 'passing', label: 'Pase' },
    { key: 'dribbling', label: 'Regate' },
    { key: 'defending', label: 'Defensa' },
    { key: 'physic', label: 'Físico' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    position: ['', [Validators.required, Validators.maxLength(50)]],
    club: ['', [Validators.maxLength(100)]],
    nationality: ['', [Validators.maxLength(100)]],
    gender: ['not_specified' as PlayerGender],
    rating: [null as number | null, [Validators.required, integerInRange(0, 99)]],
    speed: [null as number | null, integerInRange(0, 99)],
    shooting: [null as number | null, integerInRange(0, 99)],
    passing: [null as number | null, integerInRange(0, 99)],
    dribbling: [null as number | null, integerInRange(0, 99)],
    defending: [null as number | null, integerInRange(0, 99)],
    physic: [null as number | null, integerInRange(0, 99)],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.playerId = id === null ? null : Number(id);
    if (this.playerId !== null) {
      this.loadPlayer(this.playerId);
    }
  }

  get isEdit(): boolean {
    return this.playerId !== null;
  }

  showError(name: string, error: string): boolean {
    const control = this.form.get(name);
    return !!control && control.touched && !!control.errors?.[error];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const payload = this.buildPayload();

    const request$ =
      this.playerId === null
        ? this.service.createPlayer(payload)
        : this.service.updatePlayer(this.playerId, payload);

    request$.subscribe({
      next: (player) => this.router.navigate(['/players', player.id]),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(err));
      },
    });
  }

  private loadPlayer(id: number): void {
    this.loading.set(true);
    this.service
      .getPlayer(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.form.patchValue({
            name: p.name,
            position: p.position,
            club: p.club ?? '',
            nationality: p.nationality ?? '',
            rating: p.rating,
            speed: p.speed,
            shooting: p.shooting,
            passing: p.passing,
            dribbling: p.dribbling,
            defending: p.defending,
            physic: p.physic,
          });
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(this.messageFor(err));
        },
      });
  }

  private buildPayload(): PlayerInput {
    const v = this.form.getRawValue();
    const payload: PlayerInput = {
      name: v.name.trim(),
      position: v.position.trim(),
      rating: v.rating ?? 0,
    };

    // Un skill vacío no se envía: en edición conserva el valor anterior.
    for (const { key } of this.skillFields) {
      const value = v[key];
      if (value !== null) payload[key] = value;
    }

    const club = v.club.trim();
    const nationality = v.nationality.trim();
    if (this.isEdit) {
      // En edición, un campo vacío borra el valor. El género no se edita.
      payload.club = club || null;
      payload.nationality = nationality || null;
    } else {
      if (club) payload.club = club;
      if (nationality) payload.nationality = nationality;
      payload.gender = v.gender;
    }
    return payload;
  }

  private messageFor(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) return 'Error inesperado';
    if (err.status === 0) return 'No se pudo conectar con la API';
    if (err.status === 404) return 'Jugador no encontrado';
    if (err.status === 400) {
      const message = (err.error as { message?: string | string[] } | null)
        ?.message;
      if (Array.isArray(message)) return message.join(' · ');
      if (typeof message === 'string') return message;
      return '400 · Revisá los datos';
    }
    return `${err.status} · No se pudo guardar el jugador`;
  }
}
