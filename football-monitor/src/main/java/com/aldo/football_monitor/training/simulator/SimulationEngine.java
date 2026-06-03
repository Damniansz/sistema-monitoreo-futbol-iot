package com.aldo.football_monitor.training.simulator;

import com.aldo.football_monitor.training.dto.PlayerMetricDto;
import java.util.List;

public interface SimulationEngine {
    List<PlayerMetricDto> simulateNextStep();
}
