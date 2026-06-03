package com.aldo.football_monitor.training.simulator;

import com.aldo.football_monitor.training.dto.PlayerMetricDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class SoccerPhysicsEngine implements SimulationEngine {

    private final List<PlayerState> playerStates = new ArrayList<>();
    private final Random random = new Random();

    public SoccerPhysicsEngine() {
        // Initialize the 5 players in strategic starting tactical positions (2-1-2)
        // x: 0-100, y: 0-60
        playerStates.add(new PlayerState("Jugador 1", 20.0, 15.0, 1.5, 0.5)); // Left Defender
        playerStates.add(new PlayerState("Jugador 2", 20.0, 45.0, 1.2, -0.6)); // Right Defender
        playerStates.add(new PlayerState("Jugador 3", 50.0, 30.0, 2.0, 1.0));  // Midfielder
        playerStates.add(new PlayerState("Jugador 4", 80.0, 20.0, -1.0, 1.5)); // Left Forward
        playerStates.add(new PlayerState("Jugador 5", 80.0, 40.0, -1.2, -1.2)); // Right Forward
    }

    @Override
    public List<PlayerMetricDto> simulateNextStep() {
        List<PlayerMetricDto> metrics = new ArrayList<>();

        for (PlayerState player : playerStates) {
            // Apply a small random acceleration to vector coordinates to simulate turning/inertia
            double ax = (random.nextDouble() - 0.5) * 1.6;
            double ay = (random.nextDouble() - 0.5) * 1.6;

            player.dx += ax;
            player.dy += ay;

            // Cap the displacement per step to simulate realistic max sprint speed.
            // Max speed = 33 km/h -> 9.16 m/s -> Max displacement in 0.5s is 4.58 meters.
            double displacement = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
            double maxDisplacement = 4.58;
            if (displacement > maxDisplacement) {
                player.dx = (player.dx / displacement) * maxDisplacement;
                player.dy = (player.dy / displacement) * maxDisplacement;
                displacement = maxDisplacement;
            }

            // Update player coordinate positions
            player.x += player.dx;
            player.y += player.dy;

            // Handle boundaries/pitch collision bounces (pitch size 100x60m, with 3m buffer)
            if (player.x < 3.0) {
                player.x = 3.0;
                player.dx = -player.dx * 0.7; // bounce and reduce speed
            } else if (player.x > 97.0) {
                player.x = 97.0;
                player.dx = -player.dx * 0.7;
            }

            if (player.y < 3.0) {
                player.y = 3.0;
                player.dy = -player.dy * 0.7;
            } else if (player.y > 57.0) {
                player.y = 57.0;
                player.dy = -player.dy * 0.7;
            }

            // Recalculate displacement after bounce check to be fully accurate
            displacement = Math.sqrt(player.dx * player.dx + player.dy * player.dy);

            // Speed in km/h = displacement (m per 0.5s) * 2 = m/s. m/s * 3.6 = km/h.
            // Hence, speed = displacement * 7.2.
            player.speed = displacement * 7.2;

            // Cumulative distance in meters
            player.distance += displacement;

            // Transition status logically based on speed (threshold: 4.5 km/h)
            if (player.speed > 4.5) {
                player.status = "Activo";
            } else {
                player.status = "Reposo";
            }

            // Add DTO to the batch list
            metrics.add(new PlayerMetricDto(
                    player.name,
                    player.speed,
                    player.x,
                    player.y,
                    player.distance,
                    player.status
            ));
        }

        return metrics;
    }

    // Inner class tracking player coordinates and movement direction vectors in memory
    private static class PlayerState {
        String name;
        double x;
        double y;
        double dx; // velocity vector x component (meters per half second)
        double dy; // velocity vector y component (meters per half second)
        double speed; // speed in km/h
        double distance; // accumulated distance in meters
        String status;

        public PlayerState(String name, double x, double y, double dx, double dy) {
            this.name = name;
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.speed = 0.0;
            this.distance = 0.0;
            this.status = "Activo";
        }
    }
}
