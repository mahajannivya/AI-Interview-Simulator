package com.interview.simulator.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
// this is used to configure the API
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {

        return WebClient.builder();
    }
}
