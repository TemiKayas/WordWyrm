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
 * 3. Checks access permissions (public/private, logged in/guest)
 * 4. Shows appropriate UI (login prompt, access denied, or redirect)
 * 5. Redirects to the appropriate game page:
 *    - SNAKE -> /play/snake?gameId=...
 *    - TOWER_DEFENSE -> /play/td?gameId=...
 *    - TRADITIONAL -> /play/traditional?gameId=...
 */

// Login prompt popup component
function LoginPromptPopup({
  onClose,
  onLogin
}: {
  onClose: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Content */}
        <div className="text-center pt-2">
          <h3 className="text-lg font-quicksand font-bold text-gray-800 mb-2">
            You&apos;re not logged in
          </h3>
          <p className="text-gray-600 font-quicksand text-sm mb-4">
            Would you like to sign in? Your progress will be saved if you&apos;re a member of this class.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onLogin}
              className="w-full py-2 px-4 bg-[#95b607] text-white font-quicksand font-semibold rounded hover:bg-[#7a9406] transition-colors"
            >
              Sign Up or Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Access denied page component
function AccessDeniedPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2d3436] gap-4 px-4">
      <div className="text-center">
        <h1 className="text-white font-quicksand font-bold text-2xl mb-2">
          Private Game
        </h1>
        <p className="text-gray-300 font-quicksand text-lg">
          {isLoggedIn
            ? "You are not a member of the class this game belongs to."
            : "This game is private. Please log in to access it."}
        </p>
      </div>
      <div className="flex gap-4 mt-4">
        {!isLoggedIn && (
          <Link
            href="/login"
            className="px-4 py-2 bg-[#95b607] text-white font-quicksand font-semibold rounded hover:bg-[#7a9406] transition-colors"
          >
            Log In
          </Link>
        )}
        <Link
          href="/"
          className="px-4 py-2 bg-gray-600 text-white font-quicksand font-semibold rounded hover:bg-gray-500 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function GameRouterPage() {
  const router = useRouter();
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (!shareCode) return;

    const fetchAndRedirect = async () => {
      try {
        // Fetch game data by share code
        const result = await getGameWithQuiz(shareCode);

        if (result.success) {
          const gameData = result.data.game;
          const accessState = result.data.accessState;
          const isAuthenticated = result.data.isAuthenticated;
          const gameId = gameData.id;
          const gameMode = gameData.gameMode;

          // Determine redirect URL based on game mode
          let redirectUrl: string;
          switch (gameMode) {
            case GameMode.SNAKE:
              redirectUrl = `/play/snake?gameId=${gameId}`;
              break;
            case GameMode.TOWER_DEFENSE:
              redirectUrl = `/play/td?gameId=${gameId}`;
              break;
            case GameMode.TRADITIONAL:
              redirectUrl = `/play/traditional?gameId=${gameId}`;
              break;
            default:
              setError(`Unknown game mode: ${gameMode}`);
              setLoading(false);
              return;
          }

          // Handle access state
          switch (accessState) {
            case 'allowed':
            case 'allowed_no_track':
              // User can play - redirect immediately
              router.push(redirectUrl);
              break;
            case 'prompt_login':
              // Show login prompt popup
              setPendingRedirect(redirectUrl);
              setShowLoginPrompt(true);
              setLoading(false);
              break;
            case 'private_denied':
              // Show access denied page
              setIsUserLoggedIn(isAuthenticated);
              setShowAccessDenied(true);
              setLoading(false);
              break;
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

  // Handle closing login prompt (continue as guest)
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
    if (pendingRedirect) {
      router.push(pendingRedirect);
    }
  };

  // Handle login button click
  const handleLogin = () => {
    // Store the intended redirect URL and go to login
    const currentUrl = `/play/phaser/${shareCode}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
  };

  // Access denied state
  if (showAccessDenied) {
    return <AccessDeniedPage isLoggedIn={isUserLoggedIn} />;
  }

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

  // Show login prompt if needed
  if (showLoginPrompt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2d3436]">
        <LoginPromptPopup
          onClose={handleCloseLoginPrompt}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  // This should never render because we redirect in the useEffect
  // But TypeScript needs a return statement
  return null;
}
