package com.interview.simulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class InterviewSimulatorApplication {
    public static void main(String[] args) {

        SpringApplication.run(InterviewSimulatorApplication.class, args);
        System.out.println("\n Server is running at: http://localhost:8080/\n");

    }
}
