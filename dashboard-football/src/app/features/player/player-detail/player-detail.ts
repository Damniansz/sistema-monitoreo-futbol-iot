import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WebsocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './player-detail.html',
})
export class PlayerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly wsService = inject(WebsocketService);

  readonly playerId = signal<string>('');

  readonly playerMetric = computed(() => {
    const id = this.playerId();
    return this.wsService.players().find(p => p.player === id);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '';
      this.playerId.set(id);
    });
  }
}
