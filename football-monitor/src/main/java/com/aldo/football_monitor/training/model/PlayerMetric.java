package com.aldo.football_monitor.training.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "player_metric", uniqueConstraints = {@UniqueConstraint(columnNames = {"player", "timestamp"})})
@IdClass(PlayerMetric.PlayerMetricId.class)
public class PlayerMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Id
    @Column(nullable = false)
    private Instant timestamp;

    private String player;
    private double speed;
    private double x;
    private double y;
    private double distance;
    private String status;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PlayerMetricId implements Serializable {
        private Long id;
        private Instant timestamp;
    }
}