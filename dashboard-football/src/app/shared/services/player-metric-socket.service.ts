import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';

import { PlayerMetric } from '../models/player-metric.model';

@Injectable({ providedIn: 'root' })
export class PlayerMetricSocketService {
  private readonly websocketUrl = 'ws://localhost:8080/ws';

  connect(): Observable<PlayerMetric> {
    return new Observable<PlayerMetric>(observer => {
      const client = new Client({
        webSocketFactory: () => new WebSocket(this.websocketUrl),
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => undefined,
      });

      let subscription: StompSubscription | undefined;

      client.onConnect = () => {
        subscription = client.subscribe('/topic/players', message => {
          try {
            const metric = JSON.parse(message.body) as PlayerMetric;
            observer.next(metric);
          } catch (error: unknown) {
            observer.error(error);
          }
        });
      };

      client.onWebSocketError = event => observer.error(event);
      client.onStompError = frame => {
        observer.error(new Error(frame.body || frame.headers['message'] || 'STOMP error'));
      };

      client.activate();

      return () => {
        subscription?.unsubscribe();
        void client.deactivate();
      };
    });
  }
}
