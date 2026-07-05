package com.interview.simulator.service;

import com.interview.simulator.dto.request.StartSessionRequest;
import com.interview.simulator.dto.request.SubmitAnswerRequest;
import com.interview.simulator.dto.response.EvaluationResponse;
import com.interview.simulator.dto.response.QuestionResponse;
import com.interview.simulator.dto.response.SessionResponse;
import com.interview.simulator.entity.*;
import com.interview.simulator.exception.ResourceNotFoundException;
import com.interview.simulator.exception.UnauthorizedException;
import com.interview.simulator.repository.*;
import com.interview.simulator.util.Constants;
import com.interview.simulator.util.PromptBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    @Autowired private InterviewSessionRepository sessionRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private AnswerRepository answerRepository;
    @Autowired private EvaluationRepository evaluationRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AIService aiService;

    @Transactional
    public QuestionResponse startSession(String username, StartSessionRequest request) {
        User user = findUser(username);
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setCategory(category);
        session.setCustomTopic(request.getCustomTopic());
        session.setStatus(InterviewSession.SessionStatus.IN_PROGRESS);
        session = sessionRepository.save(session);

        String prompt = PromptBuilder.buildFirstQuestionPrompt(
                category.getName(), request.getCustomTopic());
        String questionText = aiService.generateQuestion(prompt);

        Question question = new Question();
        question.setSession(session);
        question.setQuestionText(questionText);
        question.setQuestionOrder(1);
        questionRepository.save(question);

        session.setTotalQuestions(1);
        sessionRepository.save(session);

        QuestionResponse response = new QuestionResponse();
        response.setSessionId(session.getId());
        response.setQuestionId(question.getId());
        response.setQuestionText(questionText);
        response.setQuestionOrder(1);
        response.setMessage("Interview started! Good luck.");
        response.setSessionComplete(false);
        return response;
    }

    @Transactional
    public Map<String, Object> submitAnswer(String username, Long sessionId,
                                             SubmitAnswerRequest request) {
        User user = findUser(username);
        InterviewSession session = getSessionForUser(sessionId, user);

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));


        if (!question.getSession().getId().equals(sessionId)) {
            throw new UnauthorizedException("Question does not belong to this session");
        }

        Answer answer = new Answer();
        answer.setQuestion(question);
        answer.setAnswerText(request.getAnswerText());
        answerRepository.save(answer);

        String evalPrompt = PromptBuilder.buildEvaluationPrompt(
                question.getQuestionText(),
                request.getAnswerText(),
                session.getCategory().getName());
        Map<String, Object> evalData = aiService.evaluateAnswer(evalPrompt);

        Evaluation evaluation = new Evaluation();
        evaluation.setAnswer(answer);
        evaluation.setScore((Integer) evalData.get("score"));
        evaluation.setStrengths((String) evalData.get("strengths"));
        evaluation.setWeaknesses((String) evalData.get("weaknesses"));
        evaluation.setSuggestions((String) evalData.get("suggestions"));
        evaluationRepository.save(evaluation);

        int currentCount = session.getTotalQuestions();
        boolean sessionComplete = currentCount >= Constants.MAX_QUESTIONS_PER_SESSION;

        EvaluationResponse evalResponse = toEvaluationResponse(evaluation, question);


        Map<String, Object> result = new HashMap<>();
        result.put("evaluation", evalResponse);
        result.put("sessionComplete", sessionComplete);

        if (sessionComplete) {
            endSessionInternal(session);
            result.put("nextQuestion", null);
            result.put("message", "Interview completed! Check your results.");
            return result;
        }

        List<String> previousQAs = buildConversationContext(session);
        String nextPrompt = PromptBuilder.buildFollowUpQuestionPrompt(
                session.getCategory().getName(), previousQAs, session.getCustomTopic());
        String nextQuestionText = aiService.generateQuestion(nextPrompt);

        Question nextQuestion = new Question();
        nextQuestion.setSession(session);
        nextQuestion.setQuestionText(nextQuestionText);
        nextQuestion.setQuestionOrder(currentCount + 1);
        questionRepository.save(nextQuestion);

        session.setTotalQuestions(currentCount + 1);
        sessionRepository.save(session);

        QuestionResponse nextQResponse = new QuestionResponse();
        nextQResponse.setSessionId(sessionId);
        nextQResponse.setQuestionId(nextQuestion.getId());
        nextQResponse.setQuestionText(nextQuestionText);
        nextQResponse.setQuestionOrder(currentCount + 1);
        nextQResponse.setSessionComplete(false);

        result.put("nextQuestion", nextQResponse);
        result.put("message", "Answer submitted. Here is your next question.");
        return result;
    }

    @Transactional
    public SessionResponse endSession(String username, Long sessionId) {
        User user = findUser(username);
        InterviewSession session = getSessionForUser(sessionId, user);
        endSessionInternal(session);
        return toSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> getSessionResult(String username, Long sessionId) {
        User user = findUser(username);
        InterviewSession session = getSessionForUser(sessionId, user);

        List<Question> questions = questionRepository.findBySessionOrderByQuestionOrder(session);
        List<EvaluationResponse> results = new ArrayList<>();

        for (Question q : questions) {
            answerRepository.findByQuestion(q).ifPresent(answer ->
                evaluationRepository.findByAnswer(answer).ifPresent(eval ->
                    results.add(toEvaluationResponse(eval, q))
                )
            );
        }
        return results;
    }

    public List<SessionResponse> getHistory(String username) {
        User user = findUser(username);
        return sessionRepository.findByUserOrderByStartedAtDesc(user)
                .stream().map(this::toSessionResponse).collect(Collectors.toList());
    }


    private void endSessionInternal(InterviewSession session) {
        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setEndedAt(LocalDateTime.now());

        List<Question> questions = questionRepository.findBySessionOrderByQuestionOrder(session);
        double total = 0;
        int count = 0;
        for (Question q : questions) {
            var answerOpt = answerRepository.findByQuestion(q);
            if (answerOpt.isPresent()) {
                var evalOpt = evaluationRepository.findByAnswer(answerOpt.get());
                if (evalOpt.isPresent()) {
                    total += evalOpt.get().getScore();
                    count++;
                }
            }
        }
        if (count > 0) session.setAvgScore(total / count);
        sessionRepository.save(session);
    }

    private List<String> buildConversationContext(InterviewSession session) {
        List<String> qas = new ArrayList<>();
        List<Question> questions = questionRepository.findBySessionOrderByQuestionOrder(session);
        for (Question q : questions) {
            qas.add(q.getQuestionText());
            answerRepository.findByQuestion(q)
                    .ifPresent(a -> qas.add(a.getAnswerText()));
        }
        return qas;
    }

    private InterviewSession getSessionForUser(Long sessionId, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!session.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Not your session");
        }
        return session;
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SessionResponse toSessionResponse(InterviewSession s) {
        SessionResponse r = new SessionResponse();
        r.setId(s.getId());
        r.setCategoryName(s.getCategory().getName());
        r.setStatus(s.getStatus().name());
        r.setTotalQuestions(s.getTotalQuestions());
        r.setAvgScore(s.getAvgScore());
        r.setCustomTopic(s.getCustomTopic());
        r.setStartedAt(s.getStartedAt());
        r.setEndedAt(s.getEndedAt());
        return r;
    }

    private EvaluationResponse toEvaluationResponse(Evaluation eval, Question q) {
        EvaluationResponse r = new EvaluationResponse();
        r.setEvaluationId(eval.getId());
        r.setQuestionId(q.getId());
        r.setQuestionText(q.getQuestionText());
        r.setAnswerText(eval.getAnswer().getAnswerText());
        r.setScore(eval.getScore());
        r.setStrengths(eval.getStrengths());
        r.setWeaknesses(eval.getWeaknesses());
        r.setSuggestions(eval.getSuggestions());
        return r;
    }
}
