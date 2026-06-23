package com.aldo.football_monitor.training.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerMetricDto {

    private String player;

    private double speed;

    private double x;

    private double y;

    private double distance;

    private String status;

    private java.time.Instant timestamp;
}