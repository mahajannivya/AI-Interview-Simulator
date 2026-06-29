package com.interview.simulator.controller;

import com.interview.simulator.entity.Category;
import com.interview.simulator.entity.User;
import com.interview.simulator.repository.InterviewSessionRepository;
import com.interview.simulator.repository.UserRepository;
import com.interview.simulator.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private InterviewSessionRepository sessionRepository;
    @Autowired private CategoryService categoryService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers = userRepository.count();
        long totalSessions = sessionRepository.count();
        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalSessions", totalSessions
        ));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.save(category));
    }

    @PutMapping("/categories/{id}/toggle")
    public ResponseEntity<Void> toggleCategory(@PathVariable Long id) {
        categoryService.toggleActive(id);
        return ResponseEntity.ok().build();
    }
}
