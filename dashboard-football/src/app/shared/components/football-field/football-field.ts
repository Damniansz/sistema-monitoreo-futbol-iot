import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerMetric } from '../../models/player-metric.model';

@Component({
  selector: 'app-football-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './football-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FootballField {
  @Input() players: PlayerMetric[] = [];
  @Input() showConnectionLines = false;

  getPlayerInitials(name: string): string {
    if (!name) return 'P';
    const matches = name.match(/\d+/);
    if (matches) {
      return `P${matches[0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Calcula enlaces dinámicos entre compañeros adyacentes (Red de Compactitud)
  get connections() {
    const lines: { x1: number; y1: number; x2: number; y2: number; colorClass: string; dist: number }[] = [];
    const list = this.players;
    
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const p1 = list[i];
        const p2 = list[j];
        
        // Calcula la distancia euclidiana en un campo estándar de 100x60m
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Conecta a los jugadores que están dentro del rango de apoyo (menos de 35 metros)
        if (dist < 35) {
          // Color basado en la cercanía: verde para apoyo cercano, amarillo/punteado para brechas más amplias
          let colorClass = 'stroke-teal-500/40';
          if (dist > 22) {
            colorClass = 'stroke-amber-500/30';
          }
          
          lines.push({
            x1: 4 + (p1.x / 100) * 92,
            y1: 4 + (p1.y / 60) * 92,
            x2: 4 + (p2.x / 100) * 92,
            y2: 4 + (p2.y / 60) * 92,
            colorClass,
            dist
          });
        }
      }
    }
    return lines;
  }
}