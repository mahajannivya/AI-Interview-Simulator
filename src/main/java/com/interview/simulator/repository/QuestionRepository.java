package com.interview.simulator.repository;

import com.interview.simulator.entity.Question;
import com.interview.simulator.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySessionOrderByQuestionOrder(InterviewSession session);
    long countBySession(InterviewSession session);
}
