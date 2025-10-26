'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGameWithQuiz } from '@/app/actions/game';
import { Quiz } from '@/lib/processors/ai-generator';
import TowerDefenseGame from '@/components/game/TowerDefenseGame';

// main page component for playing a tower defense game
// fetches game/quiz data from share code in URL, handles loading/error states, renders tower defense game canvas
export default function TowerDefenseGamePage() {
  const router = useRouter();
  // get shareCode from URL params
  const params = useParams();
  const shareCode = params.shareCode as string;

  // state for quiz data
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // state for loading status
  const [loading, setLoading] = useState(true);
  // state for errors during fetch
  const [error, setError] = useState<string | null>(null);

  // effect hook to fetch game data on mount or shareCode change
  useEffect(() => {
    if (!shareCode) return;

    const fetchGame = async () => {
      try {
        // fetch game and quiz data by share code
        const result = await getGameWithQuiz(shareCode);

        if (result.success) {
          const gameData = result.data.game;
          // quizJson from server is a string, parse it
          if (typeof gameData.quiz.quizJson === 'string') {
            gameData.quiz.quizJson = JSON.parse(gameData.quiz.quizJson);
          }
          setQuiz(gameData.quiz.quizJson as unknown as Quiz);
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
  }, [shareCode]);

  // loading message
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading Game...</div>;
  }

  // error message
  if (error) {
    return <div className="flex items-center justify-center min-h-screen">Error: {error}</div>;
  }

  // message if quiz data fails to load
  if (!quiz) {
    return <div className="flex items-center justify-center min-h-screen">Could not load quiz data.</div>;
  }

  // render TowerDefenseGame with quiz data
  return (
    <div id="tower-defense-container" className="relative w-full h-screen flex items-center justify-center bg-[#8bc34a]">
      {/* back button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 bg-[#473025] hover:bg-[#5a3d2e] text-white font-quicksand font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-lg"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      <TowerDefenseGame quiz={quiz} />
    </div>
  );
}
