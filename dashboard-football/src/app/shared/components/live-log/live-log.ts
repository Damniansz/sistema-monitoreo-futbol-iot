import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityLog } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-live-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveLog {
  @Input() logs: ActivityLog[] = [];
}
