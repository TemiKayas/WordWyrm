'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGameWithQuiz } from '@/app/actions/game';
import { GameMode } from '@prisma/client';

/**
 * GAME ROUTER - Redirects to correct game type based on gameMode
 *
 * This page acts as a router that:
 * 1. Receives a share code from the URL
 * 2. Fetches the game from the database
 * 3. Checks the game's gameMode field
 * 4. Redirects to the appropriate game page:
 *    - SNAKE -> /play/snake?gameId=...
 *    - TOWER_DEFENSE -> /play/td?gameId=...
 *    - TRADITIONAL -> /play/traditional?gameId=...
 */
export default function GameRouterPage() {
  const router = useRouter();
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareCode) return;

    const fetchAndRedirect = async () => {
      try {
        // Fetch game data by share code
        const result = await getGameWithQuiz(shareCode);

        if (result.success) {
          const gameData = result.data.game;
          const gameId = gameData.id;
          const gameMode = gameData.gameMode;

          // Redirect based on game mode
          switch (gameMode) {
            case GameMode.SNAKE:
              router.push(`/play/snake?gameId=${gameId}`);
              break;
            case GameMode.TOWER_DEFENSE:
              router.push(`/play/td?gameId=${gameId}`);
              break;
            case GameMode.TRADITIONAL:
              // Add traditional quiz route when implemented
              router.push(`/play/traditional?gameId=${gameId}`);
              break;
            default:
              setError(`Unknown game mode: ${gameMode}`);
              setLoading(false);
          }
        } else {
          setError(result.error);
          setLoading(false);
        }
      } catch (e) {
        setError('An unexpected error occurred.');
        console.error(e);
        setLoading(false);
      }
    };

    fetchAndRedirect();
  }, [shareCode, router]);

  // Loading state while fetching game and redirecting
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2d3436]">
        <div className="text-white font-quicksand font-bold text-xl">
          Loading Game...
        </div>
      </div>
    );
  }

  // Error state if game fetch failed or unknown game mode
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#2d3436] gap-4">
        <div className="text-white font-quicksand font-bold text-xl">
          Error: {error}
        </div>
        <Link
          href="/"
          className="text-[#95b607] font-quicksand font-semibold hover:underline"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // This should never render because we redirect in the useEffect
  // But TypeScript needs a return statement
  return null;
}
