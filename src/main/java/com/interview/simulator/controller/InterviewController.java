package com.interview.simulator.controller;

import com.interview.simulator.dto.request.StartSessionRequest;
import com.interview.simulator.dto.request.SubmitAnswerRequest;
import com.interview.simulator.dto.response.EvaluationResponse;
import com.interview.simulator.dto.response.QuestionResponse;
import com.interview.simulator.dto.response.SessionResponse;
import com.interview.simulator.entity.Category;
import com.interview.simulator.service.CategoryService;
import com.interview.simulator.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired private InterviewService interviewService;
    @Autowired private CategoryService categoryService;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }

    @PostMapping("/start")
    public ResponseEntity<QuestionResponse> startSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StartSessionRequest request) {
        return ResponseEntity.ok(
                interviewService.startSession(userDetails.getUsername(), request));
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @Valid @RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(
                interviewService.submitAnswer(userDetails.getUsername(), sessionId, request));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<SessionResponse> endSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(
                interviewService.endSession(userDetails.getUsername(), sessionId));
    }

    @GetMapping("/{sessionId}/result")
    public ResponseEntity<List<EvaluationResponse>> getResult(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(
                interviewService.getSessionResult(userDetails.getUsername(), sessionId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<SessionResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                interviewService.getHistory(userDetails.getUsername()));
    }
}
