package com.aldo.football_monitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FootballMonitorApplication {

	public static void main(String[] args) {
		SpringApplication.run(FootballMonitorApplication.class, args);
	}

}
