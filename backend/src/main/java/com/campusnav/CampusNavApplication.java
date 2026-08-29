package com.campusnav;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CampusNavApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusNavApplication.class, args);
    }
}
