'use client';

import React, { useState } from 'react';
import { QuizQuestion, QuizScore } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: (score: QuizScore) => void;
  previousScore?: QuizScore;
}

export function QuizComponent({ 
  questions, 
  onComplete,
  previousScore 
}: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    if (!submitted) {
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQuestion]: answer,
      });
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);
    
    const score = questions.reduce((acc, question, index) => {
      return acc + (selectedAnswers[index] === question.correct_answer ? 1 : 0);
    }, 0);

    onComplete({ score, total: questions.length });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setSubmitted(false);
  };

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswers[currentQuestion] === question.correct_answer;

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No quiz questions available for this module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Module Quiz</h3>
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      {showResults && submitted && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium">
                  Incorrect. The correct answer is: {question.correct_answer}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          {question.question}
        </h4>
        
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === option;
            const showCorrectAnswer = submitted && option === question.correct_answer;
            const showWrongAnswer = submitted && isSelected && option !== question.correct_answer;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  showCorrectAnswer
                    ? 'border-green-500 bg-green-50'
                    : showWrongAnswer
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="flex gap-4">
          {currentQuestion === questions.length - 1 && !submitted && (
            <Button 
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length !== questions.length}
            >
              Submit Quiz
            </Button>
          )}
          
          {submitted && currentQuestion === questions.length - 1 && (
            <Button onClick={handleRetry} variant="secondary">
              Retry Quiz
            </Button>
          )}
          
          {currentQuestion < questions.length - 1 && (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>

      {previousScore && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Previous attempt: {previousScore.score}/{previousScore.total}
        </div>
      )}
    </div>
  );
} 