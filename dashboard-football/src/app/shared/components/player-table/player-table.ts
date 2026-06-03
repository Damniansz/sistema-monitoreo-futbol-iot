import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerMetric } from '../../models/player-metric.model';

@Component({
  selector: 'app-player-table',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './player-table.html',
})
export class PlayerTable {
  @Input() players: PlayerMetric[] = [];
}