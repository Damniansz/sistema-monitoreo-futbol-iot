import { Component, inject } from '@angular/core';
import { WebsocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [],
  templateUrl: './status-card.html',
})
export class StatusCard {
  protected readonly wsService = inject(WebsocketService);
}
