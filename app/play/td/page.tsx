'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getGameWithQuiz } from '@/app/actions/game';
import { Quiz } from '@/lib/processors/ai-generator';
import TowerDefenseGame from '@/components/game/TowerDefenseGame';

// main page component for playing educational tower defense game
// fetches game/quiz data from URL params, handles loading/error states, renders TD game canvas
function TowerDefenseContent() {
  // get gameId from URL search params (optional, for fetching real quiz data)
  const searchParams = useSearchParams();
  const gameId = searchParams?.get('gameId');

  // state for quiz data
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // state for loading status
  const [loading, setLoading] = useState(true);
  // state for errors during fetch
  const [error, setError] = useState<string | null>(null);

  // effect hook to fetch game data on mount
  useEffect(() => {
    const fetchGame = async () => {
      // if no gameId provided, use sample quiz for demo
      if (!gameId) {
        // sample quiz for demo purposes
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
            },
            {
              question: "Who wrote 'Romeo and Juliet'?",
              options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
              answer: "William Shakespeare",
              explanation: "Shakespeare wrote this famous tragedy in the 1590s."
            },
            {
              question: "What is the largest ocean on Earth?",
              options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
              answer: "Pacific Ocean",
              explanation: "The Pacific Ocean covers about 46% of Earth's water surface."
            }
          ]
        });
        setLoading(false);
        return;
      }

      // fetch real game data if gameId provided
      try {
        const result = await getGameWithQuiz(gameId);

        if (result.success) {
          const gameData = result.data.game;
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
          // set error state if fetch fails
          setError(result.error);
        }
      } catch (e) {
        setError('An unexpected error occurred.');
        console.error(e);
      } finally {
        // set loading to false after fetch
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // loading message
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#8bc34a]">
      <div className="text-white font-quicksand font-bold text-xl">Loading Game...</div>
    </div>;
  }

  // error message
  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-[#8bc34a]">
      <div className="text-white font-quicksand font-bold text-xl">Error: {error}</div>
    </div>;
  }

  // message if quiz data fails to load
  if (!quiz) {
    return <div className="flex items-center justify-center min-h-screen bg-[#8bc34a]">
      <div className="text-white font-quicksand font-bold text-xl">Could not load quiz data.</div>
    </div>;
  }

  // render TowerDefenseGame with quiz data
  return (
    <div id="phaser-container" className="w-full h-screen flex items-center justify-center bg-[#8bc34a]">
      <TowerDefenseGame quiz={quiz} />
    </div>
  );
}

export default function TowerDefensePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#8bc34a]">
        <div className="text-white font-quicksand font-bold text-xl">Loading game...</div>
      </div>
    }>
      <TowerDefenseContent />
    </Suspense>
  );
}
