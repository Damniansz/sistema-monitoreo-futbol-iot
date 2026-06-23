package com.aldo.football_monitor.training.controller;

import com.aldo.football_monitor.training.model.PlayerMetric;
import com.aldo.football_monitor.training.repository.PlayerMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class PlayerMetricController {

    private final PlayerMetricRepository repository;

    @GetMapping("/{player}")
    public ResponseEntity<List<PlayerMetric>> getMetricsByPlayer(@PathVariable String player) {
        return ResponseEntity.ok(repository.findByPlayerOrderByTimestampDesc(player));
    }
}
