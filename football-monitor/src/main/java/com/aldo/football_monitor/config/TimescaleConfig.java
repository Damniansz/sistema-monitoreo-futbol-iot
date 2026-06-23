package com.aldo.football_monitor.config;

import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TimescaleConfig {

    private static final Logger log = LoggerFactory.getLogger(TimescaleConfig.class);
    private final EntityManager entityManager;

    public TimescaleConfig(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void convertToHypertable() {
        try {
            entityManager.createNativeQuery("SELECT create_hypertable('player_metric', 'timestamp', migrate_data => TRUE, if_not_exists => TRUE);")
                    .getResultList();
            log.info("TimescaleDB hypertable 'player_metric' has been verified/created.");
        } catch (Exception e) {
            log.warn("Could not create hypertable (might already exist or there's an error): {}", e.getMessage());
        }
    }
}
