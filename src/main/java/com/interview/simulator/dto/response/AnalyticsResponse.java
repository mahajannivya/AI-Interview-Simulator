package com.interview.simulator.dto.response;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AnalyticsResponse {
    private long totalInterviews;
    private long completedInterviews;
    private Double overallAvgScore;
    private Map<String, Double> categoryScores;
    private List<ScoreEntry> scoreHistory;

    @Data
    public static class ScoreEntry {
        private String date;
        private Double score;
        private String category;
    }
}
