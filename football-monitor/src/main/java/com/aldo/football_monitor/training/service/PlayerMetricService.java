package com.aldo.football_monitor.training.service;

import com.aldo.football_monitor.training.dto.PlayerMetricDto;
import com.aldo.football_monitor.training.model.PlayerMetric;
import com.aldo.football_monitor.training.repository.PlayerMetricRepository;
import com.aldo.football_monitor.training.websocket.PlayerMetricPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerMetricService {

    private final PlayerMetricPublisher publisher;
    private final PlayerMetricRepository repository;

    @Transactional
    public void processMetric(PlayerMetricDto metric) {
        // Validación de consistencia: Evitar métricas obsoletas o desordenadas (Teorema CAP - Consistencia Eventual)
        Optional<PlayerMetric> lastMetric = repository.findFirstByPlayerOrderByTimestampDesc(metric.getPlayer());
        if (lastMetric.isPresent() && !metric.getTimestamp().isAfter(lastMetric.get().getTimestamp())) {
            log.warn("Métrica descartada por timestamp obsoleto/duplicado para jugador: {}", metric.getPlayer());
            return;
        }

        PlayerMetric entity = new PlayerMetric();
        entity.setTimestamp(metric.getTimestamp());
        entity.setPlayer(metric.getPlayer());
        entity.setSpeed(metric.getSpeed());
        entity.setX(metric.getX());
        entity.setY(metric.getY());
        entity.setDistance(metric.getDistance());
        entity.setStatus(metric.getStatus());

        try {
            repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            // Manejo de concurrencia: si dos hilos intentan guardar al mismo tiempo, el UniqueConstraint lo evita
            log.warn("Colisión concurrente: Métrica duplicada rechazada por BD para jugador: {}", metric.getPlayer());
            return;
        }

        // Publicar al WebSocket solo si se guardó exitosamente
        publisher.publish(metric);
    }
}