package com.aldo.football_monitor.training.repository;

import com.aldo.football_monitor.training.model.PlayerMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerMetricRepository extends JpaRepository<PlayerMetric, PlayerMetric.PlayerMetricId> {
    List<PlayerMetric> findByPlayerOrderByTimestampDesc(String player);
    Optional<PlayerMetric> findFirstByPlayerOrderByTimestampDesc(String player);
}
