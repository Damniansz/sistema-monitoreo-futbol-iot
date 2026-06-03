package com.aldo.football_monitor.training.service;

import com.aldo.football_monitor.training.dto.PlayerMetricDto;
import com.aldo.football_monitor.training.websocket.PlayerMetricPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlayerMetricService {

    private final PlayerMetricPublisher publisher;

    public void processMetric(
            PlayerMetricDto metric) {

        publisher.publish(metric);
    }
}