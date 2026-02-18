package com.lingua.hub.service;

import com.lingua.hub.dto.quiz.*;
import com.lingua.hub.entity.*;
import com.lingua.hub.exception.BadRequestException;
import com.lingua.hub.exception.ResourceNotFoundException;
import com.lingua.hub.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Transactional
    public QuizDTO createQuiz(CreateQuizRequest request, UUID professorId) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ResourceNotFoundException("Professor not found"));

        Room room = roomRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .session(room)
                .language(room.getLanguage())
                .timeLimit(request.getTimeLimit())
                .passingScore(request.getPassingScore())
                .isPublished(false)
                .createdBy(professor)
                .build();

        // Add questions
        List<QuizQuestion> questions = new java.util.ArrayList<>();
        for (int i = 0; i < request.getQuestions().size(); i++) {
            CreateQuizQuestionRequest q = request.getQuestions().get(i);
            questions.add(QuizQuestion.builder()
                    .quiz(quiz)
                    .question(q.getQuestion())
                    .options(q.getOptions())
                    .correctAnswer(q.getCorrectAnswer())
                    .points(q.getPoints() != null ? q.getPoints() : 1)
                    .orderIndex(i)
                    .build());
        }
        quiz.setQuestions(questions);

        quiz = quizRepository.save(quiz);
        return mapToDTO(quiz);
    }

    @Transactional
    public QuizDTO publishQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new BadRequestException("Cannot publish quiz without questions");
        }

        quiz.setIsPublished(true);
        quiz = quizRepository.save(quiz);
        return mapToDTO(quiz);
    }

    @Transactional
    public QuizResultDTO submitQuiz(UUID quizId, SubmitQuizRequest request, UUID studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (!quiz.getIsPublished()) {
            throw new BadRequestException("Quiz is not published");
        }

        // Calculate score
        int correctCount = 0;

        List<QuizAnswer> answers = request.getAnswers().stream()
                .map(a -> {
                    QuizQuestion question = quiz.getQuestions().stream()
                            .filter(q -> q.getId().equals(a.getQuestionId()))
                            .findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

                    boolean isCorrect = question.getCorrectAnswer().equals(a.getSelectedAnswer());

                    return QuizAnswer.builder()
                            .question(question)
                            .selectedAnswer(a.getSelectedAnswer())
                            .isCorrect(isCorrect)
                            .build();
                })
                .collect(Collectors.toList());

        correctCount = (int) answers.stream().filter(QuizAnswer::getIsCorrect).count();
        int totalQuestions = quiz.getQuestions().size();
        int scorePercent = totalQuestions > 0 ? Math.round((correctCount * 100f) / totalQuestions) : 0;
        boolean passed = scorePercent >= (quiz.getPassingScore() != null ? quiz.getPassingScore() : 60);

        QuizResult result = QuizResult.builder()
                .quiz(quiz)
                .student(student)
                .score(scorePercent)
                .totalQuestions(totalQuestions)
                .passed(passed)
                .completedAt(LocalDateTime.now())
                .build();

        answers.forEach(a -> a.setResult(result));
        result.setAnswers(answers);

        QuizResult savedResult = quizResultRepository.save(result);
        return mapResultToDTO(savedResult);
    }

    public QuizDTO getQuizById(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return mapToDTO(quiz);
    }

    public Page<QuizDTO> getQuizzes(
            UUID sessionId,
            String language,
            Student.LanguageLevel level,
            Boolean isPublished,
            UUID createdBy,
            String search,
            int page,
            int size,
            String sortBy,
            String sortOrder
    ) {
        Sort sort = sortOrder.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Quiz> quizzes = quizRepository.findByFilters(
                sessionId, language, level, isPublished, createdBy, search, pageable
        );

        return quizzes.map(this::mapToDTO);
    }

    public List<QuizResultDTO> getQuizResults(UUID quizId) {
        List<QuizResult> results = quizResultRepository.findByQuizId(quizId);
        return results.stream()
                .map(this::mapResultToDTO)
                .collect(Collectors.toList());
    }

    public List<QuizResultDTO> getStudentQuizResults(UUID studentId) {
        List<QuizResult> results = quizResultRepository.findByStudentId(studentId);
        return results.stream()
                .map(this::mapResultToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        quizRepository.delete(quiz);
    }

    private QuizDTO mapToDTO(Quiz quiz) {
        List<QuizQuestionDTO> questions = quiz.getQuestions() != null
                ? quiz.getQuestions().stream()
                        .map(q -> QuizQuestionDTO.builder()
                                .id(q.getId())
                                .question(q.getQuestion())
                                .options(q.getOptions())
                                .correctAnswer(q.getCorrectAnswer())
                                .points(q.getPoints())
                                .orderIndex(q.getOrderIndex())
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        return QuizDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .sessionId(quiz.getSession() != null ? quiz.getSession().getId() : null)
                .sessionName(quiz.getSession() != null ? quiz.getSession().getName() : null)
                .language(quiz.getLanguage())
                .timeLimit(quiz.getTimeLimit())
                .passingScore(quiz.getPassingScore())
                .isPublished(quiz.getIsPublished())
                .createdBy(quiz.getCreatedBy().getId())
                .createdByName(quiz.getCreatedBy().getUser().getName())
                .questions(questions)
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }

    private QuizResultDTO mapResultToDTO(QuizResult result) {
        List<QuizAnswerDTO> answers = result.getAnswers() != null
                ? result.getAnswers().stream()
                        .map(a -> QuizAnswerDTO.builder()
                                .questionId(a.getQuestion().getId())
                                .question(a.getQuestion().getQuestion())
                                .selectedAnswer(a.getSelectedAnswer())
                                .correctAnswer(a.getQuestion().getCorrectAnswer())
                                .isCorrect(a.getIsCorrect())
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        Quiz quiz = result.getQuiz();
        Student student = result.getStudent();

        return QuizResultDTO.builder()
                .id(result.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .studentId(student.getId())
                .studentName(student.getUser().getName())
                .studentAvatar(student.getUser().getAvatar())
                .sessionName(quiz.getSession() != null ? quiz.getSession().getName() : null)
                .language(quiz.getLanguage())
                .score(result.getScore())
                .totalQuestions(result.getTotalQuestions())
                .passed(result.getPassed())
                .completedAt(result.getCompletedAt())
                .answers(answers)
                .build();
    }
}
