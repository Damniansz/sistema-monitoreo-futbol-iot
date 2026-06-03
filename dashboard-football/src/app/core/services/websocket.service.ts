import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { PlayerMetric } from '../../shared/models/player-metric.model';

export type ConnectionStatus = 'Conectado' | 'Pendiente' | 'Desconectado';

export interface ActivityLog {
  time: string;
  title: string;
  detail: string;
  tone: 'success' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private readonly websocketUrl = 'ws://localhost:8080/ws';
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private historyIntervalId: any;

  // Global state signals
  readonly status = signal<ConnectionStatus>('Desconectado');
  readonly players = signal<PlayerMetric[]>([]);
  readonly logs = signal<ActivityLog[]>([
    {
      time: '--:--',
      title: 'Sistema iniciado',
      detail: 'Esperando conexión con el servidor de telemetría...',
      tone: 'info'
    }
  ]);
  
  // High-fidelity time-series histories for charts (updated once per second)
  readonly averageSpeedHistory = signal<number[]>([]);
  readonly maxSpeedHistory = signal<number[]>([]);

  // Position and speed history for tactical heatmaps (last 100 coordinates + speed per player)
  readonly playerTrackingHistory = signal<Record<string, { x: number; y: number; speed: number }[]>>({});

  // Speed zone duration counters (number of messages/seconds spent in each zone)
  readonly playerZoneBreakdown = signal<Record<string, { walk: number; trot: number; run: number; sprint: number }>>({});

  // Cumulative sprint counters (transitions from <25 km/h to >=25 km/h)
  readonly playerSprintCounts = signal<Record<string, number>>({});

  // Peak speed recorded per player during the session
  readonly playerMaxSpeeds = signal<Record<string, number>>({});

  // Computed metrics
  readonly connectedPlayersCount = computed(() => {
    return this.players().filter(p => p.status.toLowerCase() !== 'offline').length;
  });

  readonly averageSpeed = computed(() => {
    const list = this.players();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, p) => acc + p.speed, 0);
    return sum / list.length;
  });

  readonly totalDistance = computed(() => {
    return this.players().reduce((acc, p) => acc + p.distance, 0);
  });

  readonly alertCount = computed(() => {
    return this.players().filter(p => p.speed > 30).length;
  });

  constructor() {
    this.connect();
    this.startHistoryLogger();
  }

  private connect(): void {
    this.status.set('Pendiente');
    
    this.client = new Client({
      webSocketFactory: () => new WebSocket(this.websocketUrl),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
    });

    this.client.onConnect = () => {
      this.status.set('Conectado');
      this.addLog(
        'WebSocket Conectado',
        'Conexión establecida con el servidor en ws://localhost:8080/ws',
        'success'
      );

      this.subscription = this.client!.subscribe('/topic/players', (message) => {
        try {
          const metric = JSON.parse(message.body) as PlayerMetric;
          this.handlePlayerMetric(metric);
        } catch (e) {
          console.error('Error al parsear métricas del jugador:', e);
        }
      });
    };

    this.client.onStompError = (frame) => {
      this.status.set('Desconectado');
      this.addLog(
        'Error STOMP',
        frame.body || 'Se detectó un error en el protocolo STOMP',
        'warning'
      );
    };

    this.client.onWebSocketClose = () => {
      this.status.set('Desconectado');
      this.addLog(
        'Conexión Cerrada',
        'El canal de comunicación WebSocket fue cerrado',
        'warning'
      );
    };

    this.client.onWebSocketError = () => {
      this.status.set('Desconectado');
      this.addLog(
        'Error de Conexión',
        'No se pudo establecer contacto con el servidor. Reintentando...',
        'warning'
      );
    };

    this.client.activate();
  }

  private startHistoryLogger(): void {
    // Record team performance averages/peaks once every second for smoother charts
    this.historyIntervalId = setInterval(() => {
      const currentPlayers = this.players();
      if (currentPlayers.length === 0) return;

      const avg = this.averageSpeed();
      const max = Math.max(...currentPlayers.map(p => p.speed));

      this.averageSpeedHistory.update(history => {
        const next = [...history, avg];
        return next.slice(-40); // Keep last 40 seconds
      });

      this.maxSpeedHistory.update(history => {
        const next = [...history, max];
        return next.slice(-40); // Keep last 40 seconds
      });
    }, 1000);
  }

  private handlePlayerMetric(metric: PlayerMetric): void {
    const list = this.players();
    const index = list.findIndex(p => p.player === metric.player);
    const updatedList = [...list];

    // 1. Update Tracking position history (x, y, speed)
    this.playerTrackingHistory.update(history => {
      const playerHistory = history[metric.player] || [];
      const nextHistory = [...playerHistory, { x: metric.x, y: metric.y, speed: metric.speed }].slice(-100);
      return { ...history, [metric.player]: nextHistory };
    });

    // 2. Update Speed Zone breakdown duration counts
    this.playerZoneBreakdown.update(breakdown => {
      const current = breakdown[metric.player] || { walk: 0, trot: 0, run: 0, sprint: 0 };
      const next = { ...current };
      if (metric.speed < 5) next.walk++;
      else if (metric.speed <= 12) next.trot++;
      else if (metric.speed <= 25) next.run++;
      else next.sprint++;
      return { ...breakdown, [metric.player]: next };
    });

    // 2.5 Update peak speeds
    this.playerMaxSpeeds.update(maxSpeeds => {
      const currentMax = maxSpeeds[metric.player] || 0;
      return { ...maxSpeeds, [metric.player]: Math.max(currentMax, metric.speed) };
    });

    if (index >= 0) {
      const prev = list[index];
      updatedList[index] = metric;

      // 3. Track sprint count transitions (crossing 25 km/h threshold)
      if (metric.speed >= 25 && prev.speed < 25) {
        this.playerSprintCounts.update(counts => {
          const current = counts[metric.player] || 0;
          return { ...counts, [metric.player]: current + 1 };
        });
      }
      
      // Log significant speed alerts
      if (metric.speed >= 30 && prev.speed < 30) {
        this.addLog(
          '¡Velocidad Alta!',
          `${metric.player} alcanzó un ritmo rápido de ${metric.speed.toFixed(1)} km/h`,
          'warning'
        );
      } else if (metric.status !== prev.status) {
        this.addLog(
          'Cambio de Estado',
          `${metric.player} cambió su estado a "${metric.status}"`,
          'info'
        );
      }
    } else {
      updatedList.push(metric);
      
      // Track initial sprint if the player is already sprinting when detected
      if (metric.speed >= 25) {
        this.playerSprintCounts.update(counts => {
          const current = counts[metric.player] || 0;
          return { ...counts, [metric.player]: current + 1 };
        });
      }

      this.addLog(
        'Jugador Detectado',
        `${metric.player} se ha unido al monitoreo en vivo`,
        'success'
      );
    }

    this.players.set(updatedList);
  }

  private addLog(title: string, detail: string, tone: 'success' | 'warning' | 'info'): void {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.update(current => [
      { time, title, detail, tone },
      ...current.slice(0, 24)
    ]);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.client) {
      void this.client.deactivate();
    }
    if (this.historyIntervalId) {
      clearInterval(this.historyIntervalId);
    }
  }
}
