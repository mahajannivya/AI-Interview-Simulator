package com.interview.simulator.repository;

import com.interview.simulator.entity.Evaluation;
import com.interview.simulator.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    Optional<Evaluation> findByAnswer(Answer answer);
}
