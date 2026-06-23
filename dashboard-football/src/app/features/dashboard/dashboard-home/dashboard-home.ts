import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { FootballField } from '../../../shared/components/football-field/football-field';
import { PlayerTable } from '../../../shared/components/player-table/player-table';
import { LiveLog } from '../../../shared/components/live-log/live-log';
import { KpiCard } from '../../../shared/components/kpi-card/kpi-card';
import { StatusCard } from '../../../shared/components/status-card/status-card';
import { WebsocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    DecimalPipe, 
    FootballField, 
    PlayerTable, 
    LiveLog, 
    KpiCard, 
    StatusCard
  ],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHome {
  protected readonly wsService = inject(WebsocketService);
  protected readonly authService = inject(AuthService);
  protected readonly Math = Math;

  readonly isStaff = computed(() => {
    return this.authService.hasRole('ADMIN') || 
           this.authService.hasRole('COACH') || 
           this.authService.hasRole('ANALYST');
  });

  // Controles interactivos
  readonly selectedPlayer = signal<string>('all');
  readonly heatmapMode = signal<'occupancy' | 'speed'>('occupancy');
  readonly hoveredIndex = signal<number | null>(null);

  // Control del widget avanzado de pestañas
  readonly activeTab = signal<'leaders' | 'compare' | 'group'>('leaders');
  readonly comparePlayer1 = signal<string>('');
  readonly comparePlayer2 = signal<string>('');

  // Mapeo de posición a los límites del campo
  private normalizeY(v: number): number {
    const height = 180;
    const maxRange = 35;
    const clamped = Math.max(0, Math.min(maxRange, v));
    return height - 15 - (clamped / maxRange) * (height - 30);
  }

  // Establece el jugador seleccionado para el mapa de calor
  protected onPlayerChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedPlayer.set(value);
  }

  // Establece el modo del mapa de calor
  protected onModeChange(mode: 'occupancy' | 'speed'): void {
    this.heatmapMode.set(mode);
  }

  // Controles de pestañas
  protected onTabChange(tab: 'leaders' | 'compare' | 'group'): void {
    this.activeTab.set(tab);
  }

  // Cambios en los menús desplegables de comparación
  protected onCompareP1Change(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.comparePlayer1.set(value);
  }

  protected onCompareP2Change(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.comparePlayer2.set(value);
  }

  // Calcula las coordenadas y el estilo del mapa de calor basándose en los filtros activos
  readonly heatmapPoints = computed(() => {
    const sel = this.selectedPlayer();
    const mode = this.heatmapMode();
    const history = this.wsService.playerTrackingHistory();
    
    const points: { x: number; y: number; colorClass: string; opacity: number; size: number }[] = [];
    
    const processPlayerHistory = (playerName: string, isSingle: boolean) => {
      const tracking = history[playerName] || [];
      const baseOpacity = isSingle ? 0.22 : 0.12;
      const baseSize = isSingle ? 24 : 16;
      
      tracking.forEach((pt) => {
        let colorClass = 'bg-amber-500'; // Halo de ocupación cálido por defecto
        if (mode === 'speed') {
          if (pt.speed < 5) colorClass = 'bg-slate-400 dark:bg-slate-500';
          else if (pt.speed <= 12) colorClass = 'bg-emerald-500';
          else if (pt.speed <= 25) colorClass = 'bg-amber-500';
          else colorClass = 'bg-rose-500';
        }
        
        points.push({
          x: (pt.x / 100) * 100, // mapear al porcentaje del ancho del campo
          y: (pt.y / 60) * 100,  // mapear al porcentaje de la altura del campo
          colorClass,
          opacity: baseOpacity,
          size: baseSize
        });
      });
    };
    
    if (sel === 'all') {
      for (const playerName of Object.keys(history)) {
        processPlayerHistory(playerName, false);
      }
    } else {
      processPlayerHistory(sel, true);
    }
    
    return points;
  });

  // Generador de curvas Bézier cúbicas suaves
  private getCurvePathForPoints(points: number[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) {
      const y = this.normalizeY(points[0]);
      return `M 0 ${y} L 420 ${y}`;
    }
    const width = 420;
    const horizontalStep = width / (points.length - 1);
    
    let path = `M 0 ${this.normalizeY(points[0])}`;
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = i * horizontalStep;
      const y1 = this.normalizeY(points[i]);
      const x2 = (i + 1) * horizontalStep;
      const y2 = this.normalizeY(points[i + 1]);
      
      // Puntos de control para una interpolación suave
      const cpX1 = x1 + horizontalStep / 3;
      const cpY1 = y1;
      const cpX2 = x2 - horizontalStep / 3;
      const cpY2 = y2;
      
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x2} ${y2}`;
    }
    return path;
  }

  readonly avgTrendPath = computed(() => {
    return this.getCurvePathForPoints(this.wsService.averageSpeedHistory());
  });

  readonly avgTrendAreaPath = computed(() => {
    const points = this.wsService.averageSpeedHistory();
    const path = this.avgTrendPath();
    if (!path || points.length === 0) return '';
    const lastX = 420;
    const bottomY = 165; // Límite inferior del gráfico SVG (alto - 15)
    return `${path} L ${lastX} ${bottomY} L 0 ${bottomY} Z`;
  });

  readonly maxTrendPath = computed(() => {
    return this.getCurvePathForPoints(this.wsService.maxSpeedHistory());
  });

  // Eventos interactivos del ratón en el gráfico de tendencia SVG
  protected onChartMouseMove(event: MouseEvent): void {
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    
    const avgHistory = this.wsService.averageSpeedHistory();
    if (avgHistory.length === 0) return;
    
    const index = Math.round(pct * (avgHistory.length - 1));
    this.hoveredIndex.set(index);
  }

  protected onChartMouseLeave(): void {
    this.hoveredIndex.set(null);
  }

  // Datos expuestos a la tarjeta interactiva de información sobre la tendencia (tooltip)
  readonly hoveredData = computed(() => {
    const idx = this.hoveredIndex();
    if (idx === null) return null;
    
    const avgHistory = this.wsService.averageSpeedHistory();
    const maxHistory = this.wsService.maxSpeedHistory();
    if (idx < 0 || idx >= avgHistory.length) return null;
    
    const avgVal = avgHistory[idx];
    const maxVal = maxHistory[idx];
    
    const totalPoints = avgHistory.length;
    const secondsAgo = totalPoints - 1 - idx;
    const timeLabel = secondsAgo === 0 ? 'Ahora' : `Hace ${secondsAgo}s`;
    
    const x = totalPoints > 1 ? (idx * 420) / (totalPoints - 1) : 0;
    const yAvg = this.normalizeY(avgVal);
    const yMax = this.normalizeY(maxVal);
    
    return {
      x,
      yAvg,
      yMax,
      avgVal,
      maxVal,
      timeLabel
    };
  });

  // Perfiles de esfuerzo del jugador (porcentajes de zonas de velocidad y conteo de sprints)
  readonly playerEfforts = computed(() => {
    const list = this.wsService.players();
    const breakdowns = this.wsService.playerZoneBreakdown();
    const sprints = this.wsService.playerSprintCounts();

    return list.map(player => {
      const name = player.player;
      const bd = breakdowns[name] || { walk: 0, trot: 0, run: 0, sprint: 0 };
      const total = bd.walk + bd.trot + bd.run + bd.sprint;
      
      const walk = total > 0 ? Math.round((bd.walk / total) * 100) : 100;
      const trot = total > 0 ? Math.round((bd.trot / total) * 100) : 0;
      const run = total > 0 ? Math.round((bd.run / total) * 100) : 0;
      const sprint = total > 0 ? Math.round((bd.sprint / total) * 100) : 0;
      
      // Corrige discrepancias menores de redondeo para sumar exactamente 100
      const sum = walk + trot + run + sprint;
      const adjustedSprint = sprint + (100 - sum);

      return {
        name,
        speed: player.speed,
        distance: player.distance,
        sprints: sprints[name] || 0,
        status: player.status,
        zones: {
          walk,
          trot,
          run,
          sprint: adjustedSprint
        }
      };
    });
  });

  // Pestaña 1: Líderes calculados
  readonly sessionLeaders = computed(() => {
    const list = this.wsService.players();
    const maxSpeeds = this.wsService.playerMaxSpeeds();
    const sprints = this.wsService.playerSprintCounts();
    if (list.length === 0) return null;
    
    let topSpeedPlayer = list[0].player;
    let topSpeedVal = maxSpeeds[topSpeedPlayer] || list[0].speed;
    
    let topDistancePlayer = list[0].player;
    let topDistanceVal = list[0].distance;
    
    let topSprintPlayer = list[0].player;
    let topSprintVal = sprints[topSprintPlayer] || 0;
    
    for (const p of list) {
      const pMax = maxSpeeds[p.player] || p.speed;
      if (pMax > topSpeedVal) {
        topSpeedVal = pMax;
        topSpeedPlayer = p.player;
      }
      
      if (p.distance > topDistanceVal) {
        topDistanceVal = p.distance;
        topDistancePlayer = p.player;
      }
      
      const pSprints = sprints[p.player] || 0;
      if (pSprints > topSprintVal) {
        topSprintVal = pSprints;
        topSprintPlayer = p.player;
      }
    }
    
    return {
      speed: { name: topSpeedPlayer, value: topSpeedVal },
      distance: { name: topDistancePlayer, value: topDistanceVal },
      sprints: { name: topSprintPlayer, value: topSprintVal }
    };
  });

  // Pestaña 2: Jugadores comparados lado a lado calculados
  readonly comparedPlayers = computed(() => {
    const list = this.wsService.players();
    if (list.length === 0) return null;
    
    let p1Name = this.comparePlayer1();
    let p2Name = this.comparePlayer2();
    
    if (!p1Name && list.length > 0) p1Name = list[0].player;
    if (!p2Name && list.length > 1) p2Name = list[1].player;
    else if (!p2Name && list.length > 0) p2Name = list[0].player;
    
    const p1Metric = list.find(p => p.player === p1Name) || list[0];
    const p2Metric = list.find(p => p.player === p2Name) || list[1] || list[0];
    
    const maxSpeeds = this.wsService.playerMaxSpeeds();
    const sprints = this.wsService.playerSprintCounts();
    const breakdowns = this.wsService.playerZoneBreakdown();
    
    const getZoneBreakdownPct = (name: string) => {
      const bd = breakdowns[name] || { walk: 0, trot: 0, run: 0, sprint: 0 };
      const total = bd.walk + bd.trot + bd.run + bd.sprint;
      if (total === 0) return { walk: 100, trot: 0, run: 0, sprint: 0 };
      return {
        walk: Math.round((bd.walk / total) * 100),
        trot: Math.round((bd.trot / total) * 100),
        run: Math.round((bd.run / total) * 100),
        sprint: Math.round((bd.sprint / total) * 100),
      };
    };
    
    return {
      p1: {
        name: p1Metric.player,
        speed: p1Metric.speed,
        maxSpeed: maxSpeeds[p1Metric.player] || p1Metric.speed,
        sprints: sprints[p1Metric.player] || 0,
        distance: p1Metric.distance,
        status: p1Metric.status,
        zones: getZoneBreakdownPct(p1Metric.player)
      },
      p2: {
        name: p2Metric.player,
        speed: p2Metric.speed,
        maxSpeed: maxSpeeds[p2Metric.player] || p2Metric.speed,
        sprints: sprints[p2Metric.player] || 0,
        distance: p2Metric.distance,
        status: p2Metric.status,
        zones: getZoneBreakdownPct(p2Metric.player)
      }
    };
  });

  // Pestaña 3: Carga de trabajo grupal
  readonly groupWorkload = computed(() => {
    const list = this.wsService.players();
    const sprints = this.wsService.playerSprintCounts();
    if (list.length === 0) return null;
    
    const totalSprints = Object.values(sprints).reduce((acc, s) => acc + s, 0);
    const totalDistance = list.reduce((acc, p) => acc + p.distance, 0);
    const totalCalories = Math.round(totalDistance * 0.08); // heurística de fútbol
    const avgSpeed = this.wsService.averageSpeed();
    
    let intensity = 'Baja';
    if (avgSpeed > 14) intensity = 'Alta';
    else if (avgSpeed > 8) intensity = 'Moderada';
    
    const avgDistance = totalDistance / list.length;
    const fatiguePct = Math.min(100, Math.round((avgDistance / 6000) * 100));
    
    return {
      totalSprints,
      totalDistance,
      totalCalories,
      intensity,
      fatiguePct
    };
  });
}
