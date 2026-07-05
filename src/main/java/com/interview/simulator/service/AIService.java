package com.interview.simulator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.simulator.exception.AIServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class AIService {

    private static final Logger logger = LoggerFactory.getLogger(AIService.class);

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public AIService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = new ObjectMapper();
    }

    public String generateQuestion(String prompt) {
        try {

            Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.3-70b-versatile",
                    "messages", List.of(
                            Map.of(
                                    "role", "user",
                                    "content", prompt
                            )
                    ),
                    "temperature", 0.7
            );

            JsonNode response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            return response
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

        } catch (Exception e) {
            logger.error("Groq API error", e);
            throw new AIServiceException("Failed to generate question from AI", e);
        }
    }

    public Map<String, Object> evaluateAnswer(String prompt) {
        try {

            String rawResponse = generateQuestion(prompt);

            String cleaned = rawResponse.trim()
                    .replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*", "")
                    .trim();

            JsonNode json = objectMapper.readTree(cleaned);

            int score = json.path("score").asInt(5);
            score = Math.max(1, Math.min(10, score));

            return Map.of(
                    "score", score,
                    "strengths", json.path("strengths").asText("Good attempt"),
                    "weaknesses", json.path("weaknesses").asText("Needs improvement"),
                    "suggestions", json.path("suggestions").asText("Practice more")
            );

        } catch (Exception e) {

            logger.error("Failed to parse evaluation response", e);

            return Map.of(
                    "score", 5,
                    "strengths", "Answer was provided",
                    "weaknesses", "Could not fully evaluate",
                    "suggestions", "Please review the topic and try again"
            );
        }
    }
}