import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

interface TrainingSession {
  id: string;
  name: string;
  date: string;
  duration: string;
  playerCount: number;
  avgSpeed: number;
  totalDistance: number;
}

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './history-list.html',
})
export class HistoryList {
  readonly sessions = signal<TrainingSession[]>([
    {
      id: 'sess-01',
      name: 'Sesión de Velocidad e Intervalos',
      date: '2026-06-02',
      duration: '1h 20m',
      playerCount: 5,
      avgSpeed: 22.4,
      totalDistance: 3240,
    },
    {
      id: 'sess-02',
      name: 'Entrenamiento de Resistencia y Posesión',
      date: '2026-06-01',
      duration: '1h 50m',
      playerCount: 5,
      avgSpeed: 14.8,
      totalDistance: 4890,
    },
    {
      id: 'sess-03',
      name: 'Simulación de Partido Completo',
      date: '2026-05-28',
      duration: '2h 00m',
      playerCount: 5,
      avgSpeed: 19.2,
      totalDistance: 7120,
    },
    {
      id: 'sess-04',
      name: 'Sesión Táctica AM - Recuperación',
      date: '2026-05-27',
      duration: '0h 55m',
      playerCount: 5,
      avgSpeed: 11.2,
      totalDistance: 2150,
    },
  ]);
}
