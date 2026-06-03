package com.aldo.football_monitor.training.simulator;

import com.aldo.football_monitor.training.dto.PlayerMetricDto;
import com.aldo.football_monitor.training.service.PlayerMetricService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PlayerMetricSimulator {

    private final PlayerMetricService service;
    private final SimulationEngine simulationEngine;

    @Scheduled(fixedRate = 500)
    public void generateData() {
        List<PlayerMetricDto> metrics = simulationEngine.simulateNextStep();
        for (PlayerMetricDto metric : metrics) {
            service.processMetric(metric);
        }
    }
}