package com.aldo.football_monitor.training.websocket;

import com.aldo.football_monitor.training.dto.PlayerMetricDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PlayerMetricPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(
            PlayerMetricDto metric) {

        messagingTemplate.convertAndSend(
                "/topic/players",
                metric
        );
    }
}