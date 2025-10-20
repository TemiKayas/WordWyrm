'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getGameWithQuiz } from '@/app/actions/game';
import { Quiz } from '@/lib/processors/ai-generator';
import PhaserGame from '@/components/game/PhaserGame';

// main page component for playing a phaser game
// fetches game/quiz data from share code in URL, handles loading/error states, renders phaser game canvas
export default function PhaserGamePage() {
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
          setQuiz(gameData.quiz.quizJson as Quiz);
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

  // render PhaserGame with quiz data
  return (
    <div id="phaser-container" className="w-full h-screen flex items-center justify-center">
      <PhaserGame quiz={quiz} />
    </div>
  );
}
