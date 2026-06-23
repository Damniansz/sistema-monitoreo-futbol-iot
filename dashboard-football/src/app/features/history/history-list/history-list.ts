import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HistoryService, HistoricalMetric } from '../../../core/services/history.service';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexStroke,
  ApexDataLabels,
  ApexYAxis,
  ApexTooltip,
  ApexGrid
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, FormsModule, NgApexchartsModule],
  templateUrl: './history-list.html',
})
export class HistoryList implements OnInit {
  private historyService = inject(HistoryService);

  readonly metrics = signal<HistoricalMetric[]>([]);
  readonly loading = signal<boolean>(false);
  
  readonly players = ['Jugador-1', 'Jugador-2', 'Jugador-3', 'Jugador-4', 'Jugador-5'];
  selectedPlayer = signal<string>('Jugador-1');
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  chartOptions = signal<ChartOptions | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.historyService.getMetrics(this.selectedPlayer(), this.selectedDate()).subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.updateChart(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterChange() {
    this.loadData();
  }

  private updateChart(data: HistoricalMetric[]) {
    const times = data.map(m => {
      const d = new Date(m.timestamp);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    const speeds = data.map(m => m.speed);

    this.chartOptions.set({
      series: [
        {
          name: 'Velocidad (km/h)',
          data: speeds
        }
      ],
      chart: {
        height: 350,
        type: 'area',
        fontFamily: 'inherit',
        toolbar: { show: false },
        animations: { enabled: true }
      },
      colors: ['#3b82f6'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: {
        categories: times,
        labels: { style: { colors: '#64748b', fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: 10
      },
      yaxis: {
        labels: { style: { colors: '#64748b', fontSize: '10px' } },
        max: 40
      },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      tooltip: { theme: 'light' },
      title: { text: '' }
    });
  }
}
