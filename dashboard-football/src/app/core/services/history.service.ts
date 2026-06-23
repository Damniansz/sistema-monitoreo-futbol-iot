import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

export interface HistoricalMetric {
  player: string;
  speed: number;
  distance: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/history';

  getMetrics(playerName?: string, date?: string): Observable<HistoricalMetric[]> {
    let params = new URLSearchParams();
    if (playerName) params.append('player', playerName);
    if (date) params.append('date', date);

    // Simulated mock data fallback since backend API is not fully ready
    return this.http.get<HistoricalMetric[]>(`${this.apiUrl}/metrics?${params.toString()}`).pipe(
      catchError(() => {
        return of(this.generateMockMetrics(playerName, date)).pipe(delay(600));
      })
    );
  }

  private generateMockMetrics(player?: string, date?: string): HistoricalMetric[] {
    const metrics: HistoricalMetric[] = [];
    const targetPlayer = player || 'Jugador-1';
    const baseDate = date ? new Date(date) : new Date();
    baseDate.setHours(10, 0, 0, 0);

    let cumulativeDistance = 0;
    // Generamos 60 puntos (1 hora simulada)
    for (let i = 0; i < 60; i++) {
      // Simulamos ráfagas de velocidad (sprints) y trote
      const baseSpeed = Math.random() > 0.8 ? 20 + Math.random() * 12 : 5 + Math.random() * 8; 
      cumulativeDistance += (baseSpeed * 1000) / 60; // m/min aprox
      metrics.push({
        player: targetPlayer,
        speed: Number(baseSpeed.toFixed(2)),
        distance: Number(cumulativeDistance.toFixed(2)),
        timestamp: new Date(baseDate.getTime() + i * 60000).toISOString()
      });
    }
    return metrics;
  }
}
