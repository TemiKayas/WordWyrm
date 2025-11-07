'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getGameWithQuiz } from '@/app/actions/game';
import { Quiz } from '@/lib/processors/ai-generator';
import SnakeGame from '@/components/game/SnakeGame';
import { GameMode } from '@prisma/client';

// Main page component for playing educational snake quiz game
// Fetches game/quiz data from URL params, handles loading/error states, renders snake game canvas
function SnakeGameContent() {
  // Get gameId from URL search params
  const searchParams = useSearchParams();
  const gameId = searchParams?.get('gameId');

  // State for quiz data
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for errors during fetch
  const [error, setError] = useState<string | null>(null);

  // Effect hook to fetch game data on mount
  useEffect(() => {
    const fetchGame = async () => {
      // If no gameId provided, use sample quiz for demo
      if (!gameId) {
        // Sample quiz for demo purposes
        setQuiz({
          questions: [
            {
              question: "What is the capital of France?",
              options: ["London", "Berlin", "Paris", "Madrid"],
              answer: "Paris",
              explanation: "Paris is the capital and largest city of France."
            },
            {
              question: "What is 2 + 2?",
              options: ["3", "4", "5", "6"],
              answer: "4",
              explanation: "Basic addition: 2 + 2 = 4"
            },
            {
              question: "Which planet is known as the Red Planet?",
              options: ["Venus", "Mars", "Jupiter", "Saturn"],
              answer: "Mars",
              explanation: "Mars appears red due to iron oxide on its surface."
            }
          ]
        });
        setLoading(false);
        return;
      }

      // Fetch real game data if gameId provided
      try {
        const result = await getGameWithQuiz(gameId);

        if (result.success) {
          const gameData = result.data.game;

          // Verify game mode is SNAKE
          if (gameData.gameMode !== GameMode.SNAKE) {
            setError('This game is not a Snake quiz game');
            setLoading(false);
            return;
          }

          let quizData = gameData.quiz.quizJson;

          // quizJson from server might be a string, parse it
          if (typeof quizData === 'string') {
            quizData = JSON.parse(quizData);
          }

          // Validate and type assert to Quiz
          if (quizData && typeof quizData === 'object' && 'questions' in quizData) {
            setQuiz(quizData as unknown as Quiz);
          } else {
            setError('Invalid quiz data format');
          }
        } else {
          // Set error state if fetch fails
          setError(result.error);
        }
      } catch (e) {
        setError('An unexpected error occurred.');
        console.error(e);
      } finally {
        // Set loading to false after fetch
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Loading message
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2d3436]">
        <div className="text-white font-quicksand font-bold text-xl">Loading Snake Quiz...</div>
      </div>
    );
  }

  // Error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#2d3436] gap-4">
        <div className="text-white font-quicksand font-bold text-xl">Error: {error}</div>
        <a
          href="/student/dashboard"
          className="text-[#95b607] font-quicksand font-semibold hover:underline"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  // Message if quiz data fails to load
  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2d3436]">
        <div className="text-white font-quicksand font-bold text-xl">Could not load quiz data.</div>
      </div>
    );
  }

  // Render SnakeGame with quiz data
  return (
    <div id="phaser-container" className="w-full h-screen flex items-center justify-center bg-[#2d3436]">
      <SnakeGame quiz={quiz} />
    </div>
  );
}

export default function SnakeGamePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#2d3436]">
        <div className="text-white font-quicksand font-bold text-xl">Loading game...</div>
      </div>
    }>
      <SnakeGameContent />
    </Suspense>
  );
}
