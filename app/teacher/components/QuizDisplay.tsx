'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createGameFromQuiz } from '@/app/actions/game';

// interface for a single quiz question
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// interface for the entire quiz
interface Quiz {
  questions: QuizQuestion[];
}

// props for the QuizDisplay component
interface QuizDisplayProps {
  quiz: Quiz;
  quizId: string;
}

// component to display a generated quiz and allow creating a game from it
export default function QuizDisplay({ quiz, quizId }: QuizDisplayProps) {
  // state for the created game's ID
  const [gameId, setGameId] = useState<string | null>(null);
  // state to track if game creation is in progress
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  // state for any errors during game creation
  const [error, setError] = useState<string | null>(null);

  // handles creating a new game from the current quiz
  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    setError(null);
    // call the server action to create the game
    const result = await createGameFromQuiz(quizId, `Quiz Game`);
    if (result.success) {
      // set the game ID on success
      setGameId(result.data.gameId);
    } else {
      // set the error message on failure
      setError(result.error);
    }
    setIsCreatingGame(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Generated Quiz</h2>

      {/* display error message if there is one */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* container for the list of questions */}
      <div className="space-y-6">
        {quiz.questions.map((q, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0">
            {/* question text */}
            <div className="flex gap-2 mb-3">
              <span className="font-semibold text-blue-600">Q{index + 1}.</span>
              <p className="font-medium">{q.question}</p>
            </div>

            {/* options for the question */}
            <div className="ml-8 space-y-2">
              {q.options.map((option, optIndex) => {
                const isCorrect = option === q.answer;
                return (
                  <div
                    key={optIndex}
                    className={`p-2 rounded ${
                      isCorrect
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span>{option}</span>
                      {/* show checkmark if the option is correct */}
                      {isCorrect && (
                        <span className="ml-auto text-green-600 text-sm font-semibold">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* explanation for the answer */}
            {q.explanation && (
              <div className="ml-8 mt-3 p-3 bg-blue-50 rounded text-sm">
                <span className="font-semibold text-blue-900">Explanation: </span>
                <span className="text-blue-800">{q.explanation}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* action buttons at the bottom */}
      <div className="mt-6 flex gap-3">
        {!gameId ? (
          // show create game button if game hasnt been created yet
          <button
            onClick={handleCreateGame}
            disabled={isCreatingGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isCreatingGame ? 'Creating Game...' : 'Create Game from Quiz'}
          </button>
        ) : (
          // show play game link if game has been created
          <Link href={`/play/phaser/${gameId}`}>
            <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Play Phaser Game
            </span>
          </Link>
        )}
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Edit Quiz
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Export Quiz
        </button>
      </div>
    </div>
  );
}