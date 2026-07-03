package com.interview.simulator.repository;

import com.interview.simulator.entity.InterviewSession;
import com.interview.simulator.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    List<InterviewSession> findByUserOrderByStartedAtDesc(User user);

    List<InterviewSession> findByUserAndStatusOrderByStartedAtDesc(
            User user, InterviewSession.SessionStatus status);

    long countByUser(User user);

    long countByUserAndStatus(User user, InterviewSession.SessionStatus status);

    @Query("SELECT AVG(s.avgScore) FROM InterviewSession s WHERE s.user = :user AND s.avgScore IS NOT NULL")
    Double findAvgScoreByUser(@Param("user") User user);

    @Query("SELECT s.category.name, AVG(s.avgScore) FROM InterviewSession s " +
           "WHERE s.user = :user AND s.avgScore IS NOT NULL " +
           "GROUP BY s.category.name")
    List<Object[]> findAvgScoreByCategory(@Param("user") User user);

    @Query("SELECT s FROM InterviewSession s WHERE s.user = :user AND s.avgScore IS NOT NULL " +
           "ORDER BY s.startedAt DESC")
    List<InterviewSession> findRecentSessionsWithScore(@Param("user") User user);
}
