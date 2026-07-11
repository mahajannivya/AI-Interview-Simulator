package com.interview.simulator.util;

import java.util.List;

public class PromptBuilder {

    public static String buildFirstQuestionPrompt(String category, String customTopic) {
        String topic = (customTopic != null && !customTopic.isBlank()) ? customTopic : category;
        return String.format("""
            You are a professional interviewer conducting a %s interview.
            Generate the first interview question for a fresher to intermediate level candidate.
            The question should be clear, concise, and relevant to %s.
            Respond with ONLY the question text, no preamble or explanation.
            """, topic, topic);
    }

    public static String buildFollowUpQuestionPrompt(
            String category, List<String> previousQAs, String customTopic) {
        String topic = (customTopic != null && !customTopic.isBlank()) ? customTopic : category;
        StringBuilder context = new StringBuilder();
        context.append(String.format(
                "You are a professional interviewer conducting a %s interview.\n", topic));
        context.append("Here is the conversation so far:\n\n");

        for (int i = 0; i < previousQAs.size(); i += 2) {
            context.append("Q: ").append(previousQAs.get(i)).append("\n");
            if (i + 1 < previousQAs.size()) {
                context.append("A: ").append(previousQAs.get(i + 1)).append("\n\n");
            }
        }

        context.append("""
            Based on the above conversation, generate the next interview question.
            Make it a natural follow-up or cover a new important area of %s.
            Keep it relevant for a fresher to intermediate level candidate.
            Respond with ONLY the question text, no preamble.
            """.formatted(topic));

        return context.toString();
    }

    public static String buildEvaluationPrompt(String question, String answer, String category) {
        return String.format("""
            You are an expert %s interviewer. Evaluate the following interview answer.
            
            Question: %s
            Answer: %s
            
            Provide your evaluation in the following JSON format exactly:
            {
              "score": <integer from 1 to 10>,
              "strengths": "<what the candidate did well>",
              "weaknesses": "<areas where the answer was lacking>",
              "suggestions": "<specific improvements the candidate should make>"
            }
            
            Respond with ONLY the JSON object, no markdown, no extra text.
            """, category, question, answer);
    }
}
