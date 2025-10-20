'use client';

import { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

interface QuizDisplayProps {
  quiz: Quiz;
}

export default function QuizDisplay({ quiz }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleCheck = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.answer;
  const letters = ['a', 'b', 'c', 'd', 'e', 'f'];

  return (
    <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center p-4">
      {/* question header */}
      <div className="mb-8 text-center">
        <h2 className="font-quicksand font-bold text-brown text-[36px] sm:text-[48px] inline">
          Question {currentQuestionIndex + 1}
        </h2>
        <span className="font-quicksand font-bold text-[#c4a46f] text-[14px] sm:text-[16px] ml-2">
          / {totalQuestions}
        </span>
      </div>

      {/* question text */}
      <p className="font-quicksand font-bold text-brown text-[18px] sm:text-[20px] lg:text-[24px] text-center mb-8 sm:mb-12 max-w-[90%] sm:max-w-[529px] px-4">
        {currentQuestion.question}
      </p>

      {/* options container */}
      <div className="bg-[#f1e8d9] rounded-[20px] sm:rounded-[26px] p-4 sm:p-8 lg:p-12 w-full max-w-[95%] sm:max-w-[876px] mb-8">
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const letter = letters[index];
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === currentQuestion.answer;

            let bgColor = 'bg-[#fffdf9]';
            let borderColor = 'border-transparent';

            if (showResult && isCorrectAnswer) {
              bgColor = 'bg-[#faffd2]';
              borderColor = 'border-[#b0d415]';
            } else if (showResult && isSelected && !isCorrect) {
              bgColor = 'bg-[#ffeef3]';
              borderColor = 'border-[#ff9899]';
            } else if (isSelected) {
              borderColor = 'border-brown';
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && handleAnswerSelect(option)}
                disabled={showResult}
                className={`${bgColor} ${borderColor} border-2 rounded-[14px] h-[70px] sm:h-[82px] w-full flex items-center px-6 transition-all hover:shadow-md disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-4 w-full">
                  {/* letter circle */}
                  <div className="bg-brown rounded-full w-[28px] h-[28px] flex items-center justify-center flex-shrink-0">
                    <span className="font-quicksand font-bold text-[#fffdf9] text-[16px]">
                      {letter}
                    </span>
                  </div>

                  {/* option text */}
                  <span className="font-quicksand font-bold text-brown text-[18px] sm:text-[24px] text-left flex-1">
                    {option}
                  </span>

                  {/* checkmark or x for result */}
                  {showResult && isCorrectAnswer && (
                    <span className="text-[#b0d415] text-2xl">✓</span>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <span className="text-[#ff9899] text-2xl">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* action buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {!showResult ? (
          <button
            onClick={handleCheck}
            disabled={!selectedAnswer}
            className="bg-[#96b902] hover:bg-[#7a9700] text-[#fffdfa] font-quicksand font-bold text-[20px] sm:text-[24px] rounded-[14px] h-[56px] sm:h-[66px] px-12 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CHECK
          </button>
        ) : (
          <>
            {currentQuestionIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="bg-[#f1e8d9] hover:bg-[#ede3d8] text-brown font-quicksand font-bold text-[18px] sm:text-[20px] rounded-[14px] h-[56px] sm:h-[66px] px-8 transition-all"
              >
                Previous
              </button>
            )}
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="bg-[#96b902] hover:bg-[#7a9700] text-[#fffdfa] font-quicksand font-bold text-[18px] sm:text-[20px] rounded-[14px] h-[56px] sm:h-[66px] px-8 transition-all"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => {
                  // handle quiz completion
                  alert('Quiz completed! You can now create a game from this quiz.');
                }}
                className="bg-brown hover:bg-brown-dark text-white font-quicksand font-bold text-[18px] sm:text-[20px] rounded-[14px] h-[56px] sm:h-[66px] px-8 transition-all"
              >
                Finish & Create Game
              </button>
            )}
          </>
        )}
      </div>

      {/* explanation (if shown after check) */}
      {showResult && currentQuestion.explanation && (
        <div className="mt-8 bg-[#fff6e8] border-2 border-[#ff9f22] rounded-[14px] p-6 max-w-[876px] w-full">
          <p className="font-quicksand font-bold text-brown text-[16px] sm:text-[18px]">
            <span className="text-[#ff9f22]">Explanation:</span> {currentQuestion.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
