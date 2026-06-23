import { Injectable, signal, computed, OnDestroy, inject } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { PlayerMetric } from '../../shared/models/player-metric.model';
import { LoggerService } from './logger.service';

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
  private logger = inject(LoggerService);

  // Signals de estado global
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
  
  // Historial de series de tiempo de alta fidelidad para gráficos (actualizado una vez por segundo)
  readonly averageSpeedHistory = signal<number[]>([]);
  readonly maxSpeedHistory = signal<number[]>([]);

  // Historial de posición y velocidad para mapas de calor tácticos (últimas 100 coordenadas + velocidad por jugador)
  readonly playerTrackingHistory = signal<Record<string, { x: number; y: number; speed: number }[]>>({});

  // Contadores de duración de zonas de velocidad (número de mensajes/segundos transcurridos en cada zona)
  readonly playerZoneBreakdown = signal<Record<string, { walk: number; trot: number; run: number; sprint: number }>>({});

  // Contadores de sprints acumulados (transiciones de <25 km/h a >=25 km/h)
  readonly playerSprintCounts = signal<Record<string, number>>({});

  // Velocidad pico registrada por jugador durante la sesión
  readonly playerMaxSpeeds = signal<Record<string, number>>({});

  // Métricas calculadas
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
      this.logger.info('WebSocket Conectado', 'Conexión establecida con el servidor en ws://localhost:8080/ws');
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
          this.logger.error('Error al parsear métricas del jugador:', e);
        }
      });
    };

    this.client.onStompError = (frame) => {
      this.status.set('Desconectado');
      this.logger.error('Error STOMP detectado', frame.body);
      this.addLog(
        'Error STOMP',
        frame.body || 'Se detectó un error en el protocolo STOMP',
        'warning'
      );
    };

    this.client.onWebSocketClose = () => {
      this.status.set('Desconectado');
      this.logger.warn('Conexión WebSocket cerrada');
      this.addLog(
        'Conexión Cerrada',
        'El canal de comunicación WebSocket fue cerrado',
        'warning'
      );
    };

    this.client.onWebSocketError = () => {
      this.status.set('Desconectado');
      this.logger.error('Error de conexión WebSocket');
      this.addLog(
        'Error de Conexión',
        'No se pudo establecer contacto con el servidor. Reintentando...',
        'warning'
      );
    };

    this.client.activate();
  }

  private startHistoryLogger(): void {
    // Registra los promedios y picos de rendimiento del equipo una vez por segundo para suavizar los gráficos
    this.historyIntervalId = setInterval(() => {
      const currentPlayers = this.players();
      if (currentPlayers.length === 0) return;

      const avg = this.averageSpeed();
      const max = Math.max(...currentPlayers.map(p => p.speed));

      this.averageSpeedHistory.update(history => {
        const next = [...history, avg];
        return next.slice(-40); // Mantiene los últimos 40 segundos
      });

      this.maxSpeedHistory.update(history => {
        const next = [...history, max];
        return next.slice(-40); // Mantiene los últimos 40 segundos
      });
    }, 1000);
  }

  private handlePlayerMetric(metric: PlayerMetric): void {
    const list = this.players();
    const index = list.findIndex(p => p.player === metric.player);
    const updatedList = [...list];

    // 1. Actualiza el historial de posición de seguimiento (x, y, velocidad)
    this.playerTrackingHistory.update(history => {
      const playerHistory = history[metric.player] || [];
      const nextHistory = [...playerHistory, { x: metric.x, y: metric.y, speed: metric.speed }].slice(-100);
      return { ...history, [metric.player]: nextHistory };
    });

    // 2. Actualiza los contadores de desglose de duración de zonas de velocidad
    this.playerZoneBreakdown.update(breakdown => {
      const current = breakdown[metric.player] || { walk: 0, trot: 0, run: 0, sprint: 0 };
      const next = { ...current };
      if (metric.speed < 5) next.walk++;
      else if (metric.speed <= 12) next.trot++;
      else if (metric.speed <= 25) next.run++;
      else next.sprint++;
      return { ...breakdown, [metric.player]: next };
    });

    // 2.5 Actualiza las velocidades máximas (pico)
    this.playerMaxSpeeds.update(maxSpeeds => {
      const currentMax = maxSpeeds[metric.player] || 0;
      return { ...maxSpeeds, [metric.player]: Math.max(currentMax, metric.speed) };
    });

    if (index >= 0) {
      const prev = list[index];
      updatedList[index] = metric;

      // 3. Registra las transiciones de conteo de sprints (cruzar el umbral de 25 km/h)
      if (metric.speed >= 25 && prev.speed < 25) {
        this.playerSprintCounts.update(counts => {
          const current = counts[metric.player] || 0;
          return { ...counts, [metric.player]: current + 1 };
        });
      }
      
      // Registra alertas de velocidad alta significativas
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
      
      // Registra el sprint inicial si el jugador ya está esprintando al ser detectado
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
