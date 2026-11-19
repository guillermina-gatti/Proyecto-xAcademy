// src/app/services/player/player.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Player {
  id: number;
  name: string;
  club: string;
  position: string;
  nationality: string;
  rating: number;
  speed: number;
  shooting: number;
  dribbling: number;
  passing: number;
}

export type PlayerGender = 'male' | 'female' | 'not_specified';

export interface PlayerSearchFilters {
  name?: string;
  club?: string;
  position?: string;
  nationality?: string;
  gender?: PlayerGender;
  fifaVersion?: number;
}

export interface PlayerListItem {
  id: number;
  name: string;
  club: string;
  position: string;
  nationality: string;
  rating: number;
}

export interface PlayerListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PlayerListResponse {
  data: PlayerListItem[];
  meta: PlayerListMeta;
}

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/players`;

  getPlayer(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.baseUrl}/${id}`);
  }

  list(
    filters: PlayerSearchFilters,
    page: number,
    limit: number,
  ): Observable<PlayerListResponse> {
    const params = this.toParams({ ...filters, page, limit });
    return this.http.get<PlayerListResponse>(this.baseUrl, { params });
  }

  // El export no acepta page ni limit (el backend rechaza campos desconocidos).
  // Se pide como blob porque <a href> no envía el token.
  exportCsv(filters: PlayerSearchFilters): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export.csv`, {
      params: this.toParams(filters),
      responseType: 'blob',
    });
  }

  private toParams(values: object): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
