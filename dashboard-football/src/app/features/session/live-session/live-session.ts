import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FootballField } from '../../../shared/components/football-field/football-field';
import { PlayerTable } from '../../../shared/components/player-table/player-table';
import { LiveLog } from '../../../shared/components/live-log/live-log';
import { WebsocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-live-session',
  standalone: true,
  imports: [
    DecimalPipe, 
    FootballField, 
    PlayerTable, 
    LiveLog
  ],
  templateUrl: './live-session.html',
  styleUrl: './live-session.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveSession implements OnInit, OnDestroy {
  protected readonly wsService = inject(WebsocketService);
  protected readonly Math = Math;

  // Controles visuales
  readonly showConnectionLines = signal<boolean>(true);

  // Cronómetro de la sesión
  readonly sessionTime = signal<number>(0);
  readonly isTimerRunning = signal<boolean>(true);
  private timerIntervalId: any;

  ngOnInit(): void {
    this.startTimer();
  }

  private startTimer(): void {
    this.timerIntervalId = setInterval(() => {
      if (this.isTimerRunning()) {
        this.sessionTime.update(t => t + 1);
      }
    }, 1000);
  }

  protected toggleTimer(): void {
    this.isTimerRunning.update(r => !r);
  }

  protected resetTimer(): void {
    this.sessionTime.set(0);
  }

  // Da formato a los segundos del cronómetro a HH:MM:SS o MM:SS
  get formattedTime(): string {
    const s = this.sessionTime();
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    
    const pad = (num: number) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  // Calcula las estadísticas de carga cardiovascular individuales para cada jugador activo
  // La velocidad se mapea a estimaciones de la zona de frecuencia cardíaca, un concepto estándar de la ciencia deportiva
  get playerCardioZones() {
    const list = this.wsService.players();
    return list.map(p => {
      let zone = 'Bajo (Recuperación)';
      let hrEstimate = '< 120 lpm';
      let colorClass = 'text-slate-400 border-slate-200/60 dark:border-slate-800/60';
      let progressClass = 'bg-slate-350 dark:bg-slate-600';
      let hrPercent = Math.round(55 + (p.speed / 35) * 45); // estimación entre el 55% y el 100% de la frecuencia cardíaca máxima
      
      if (p.speed >= 25) {
        zone = 'Máximo (Sprint)';
        hrEstimate = '> 180 lpm';
        colorClass = 'text-rose-500 border-rose-200/50 dark:border-rose-950/30';
        progressClass = 'bg-rose-500';
      } else if (p.speed >= 12) {
        zone = 'Alto (Umbral)';
        hrEstimate = '150 - 180 lpm';
        colorClass = 'text-amber-500 border-amber-200/50 dark:border-amber-950/30';
        progressClass = 'bg-amber-500';
      } else if (p.speed >= 5) {
        zone = 'Moderado (Aeróbico)';
        hrEstimate = '120 - 150 lpm';
        colorClass = 'text-emerald-500 border-emerald-200/50 dark:border-emerald-950/30';
        progressClass = 'bg-emerald-500';
      }

      return {
        name: p.player,
        speed: p.speed,
        status: p.status,
        distance: p.distance,
        zone,
        hrEstimate,
        hrPercent,
        colorClass,
        progressClass
      };
    });
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }
}
