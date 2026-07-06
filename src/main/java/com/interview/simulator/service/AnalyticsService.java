package com.interview.simulator.service;

import com.interview.simulator.dto.response.AnalyticsResponse;
import com.interview.simulator.entity.InterviewSession;
import com.interview.simulator.entity.User;
import com.interview.simulator.exception.ResourceNotFoundException;
import com.interview.simulator.repository.InterviewSessionRepository;
import com.interview.simulator.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired private InterviewSessionRepository sessionRepository;
    @Autowired private UserRepository userRepository;

    public AnalyticsResponse getAnalytics(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        AnalyticsResponse analytics = new AnalyticsResponse();
        analytics.setTotalInterviews(sessionRepository.countByUser(user));
        analytics.setCompletedInterviews(
                sessionRepository.countByUserAndStatus(user,
                        InterviewSession.SessionStatus.COMPLETED));
        analytics.setOverallAvgScore(sessionRepository.findAvgScoreByUser(user));

        // Category-wise scores
        List<Object[]> categoryData = sessionRepository.findAvgScoreByCategory(user);
        Map<String, Double> categoryScores = new HashMap<>();
        for (Object[] row : categoryData) {
            categoryScores.put((String) row[0], (Double) row[1]);
        }
        analytics.setCategoryScores(categoryScores);

        // Score history (last 10 sessions)
        List<AnalyticsResponse.ScoreEntry> history = sessionRepository
                .findRecentSessionsWithScore(user)
                .stream()
                .limit(10)
                .map(s -> {
                    AnalyticsResponse.ScoreEntry entry = new AnalyticsResponse.ScoreEntry();
                    entry.setDate(s.getStartedAt().toLocalDate().toString());
                    entry.setScore(s.getAvgScore());
                    entry.setCategory(s.getCategory().getName());
                    return entry;
                })
                .collect(Collectors.toList());
        analytics.setScoreHistory(history);

        return analytics;
    }
}
