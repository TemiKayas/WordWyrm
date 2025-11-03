'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import { getGameWithQuiz } from '@/app/actions/game';

interface GameInfo {
  title: string;
  description: string | null;
  numQuestions: number;
  qrCodeUrl: string | null;
  imageUrl?: string;
}

export default function JoinGamePage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isFetchingGame, setIsFetchingGame] = useState(false);

  // Fetch game info when a complete code is entered
  useEffect(() => {
    const fetchGameInfo = async () => {
      if (gameCode.length === 6) {
        setIsFetchingGame(true);
        setError('');
        try {
          const result = await getGameWithQuiz(gameCode);
          if (result.success) {
            setGameInfo({
              title: result.data.game.title,
              description: result.data.game.description,
              numQuestions: result.data.game.quiz.numQuestions,
              qrCodeUrl: result.data.game.qrCodeUrl,
            });
          } else {
            setGameInfo(null);
            setError('Game not found. Please check the code.');
          }
        } catch (err) {
          setGameInfo(null);
          setError('Failed to load game info.');
        } finally {
          setIsFetchingGame(false);
        }
      } else {
        setGameInfo(null);
      }
    };

    const timer = setTimeout(fetchGameInfo, 500); // Debounce
    return () => clearTimeout(timer);
  }, [gameCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setGameCode(value);
      setError('');
    }
  };

  const handleJoinGame = async () => {
    if (gameCode.length !== 6) {
      setError('Please enter a valid 6-character game code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Navigate to the game play page
      router.push(`/play/phaser/${gameCode}`);
    } catch (err) {
      setError('Failed to join game. Please try again.');
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameCode.length === 6) {
      handleJoinGame();
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-8 max-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header - Smaller and closer */}
          <div className="text-center mb-8 opacity-0 animate-[fadeInScale_0.6s_ease-out_forwards]">
            <h1 className="font-quicksand font-bold text-[#473025] text-[36px] sm:text-[48px] lg:text-[56px] mb-2 leading-tight">
              Join a Game
            </h1>
            <p className="font-quicksand font-bold text-[#a7613c] text-[16px] sm:text-[18px] lg:text-[20px]">
              Enter your game code to start playing
            </p>
          </div>

          {/* Centered Content with Character on Top */}
          <div className="flex flex-col items-center opacity-0 animate-[fadeInScale_0.8s_ease-out_0.3s_forwards] mt-[5vh]">
            {/* Character sitting on top of the card */}
            <div className="relative w-full max-w-md">
              {/* Character Image - positioned to sit right on top of card */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] z-10">
                <Image
                  src={gameInfo?.imageUrl || '/assets/gaming-floop.png'}
                  alt="WordWyrm"
                  fill
                  className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
                />
              </div>

              {/* Game Code Card */}
              <div className="bg-[#fffcf8] border-[4px] border-[#473025] rounded-[20px] p-6 sm:p-8 pt-24 shadow-[0px_8px_16px_rgba(0,0,0,0.1)] mt-16">
                {/* Loading State */}
                {isFetchingGame && (
                  <div className="flex flex-col items-center justify-center py-4 mb-4">
                    <svg className="animate-spin h-12 w-12 text-[#96b902] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-quicksand font-bold text-[#473025] text-[16px]">
                      Loading game...
                    </p>
                  </div>
                )}

                {/* Game Info Card (when game is found) */}
                {gameInfo && !isFetchingGame && (
                  <div className="mb-6 bg-gradient-to-br from-[#96b902] to-[#7a9700] border-[3px] border-[#006029] rounded-[16px] p-6 space-y-4 animate-[fadeInScale_0.4s_ease-out_forwards]">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className="font-quicksand font-bold text-white text-[16px]">
                        Game Found!
                      </p>
                    </div>

                    <h2 className="font-quicksand font-bold text-white text-[28px] sm:text-[32px] leading-tight text-center">
                      {gameInfo.title}
                    </h2>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-[10px] px-3 py-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-quicksand font-bold text-white text-[15px]">
                          {gameInfo.numQuestions} Questions
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-[10px] px-3 py-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-quicksand font-bold text-white text-[15px]">
                          Tower Defense
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Code Input */}
                <div className="mb-4">
                  <label className="font-quicksand font-bold text-[#473025] text-[16px] mb-3 block text-center">
                    Game Code
                  </label>
                  <input
                    type="text"
                    value={gameCode}
                    onChange={handleCodeChange}
                    onKeyPress={handleKeyPress}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[14px] h-[70px] px-4 font-quicksand font-bold text-[#473025] text-[32px] text-center placeholder:text-[#be9f91] focus:outline-none focus:ring-3 focus:ring-[#96b902]/30 focus:border-[#96b902] hover:border-[#ff9f22] transition-all tracking-[0.3em]"
                    autoFocus
                  />
                  <p className="font-quicksand text-[#a7613c] text-[12px] mt-2 text-center">
                    Enter the 6-character code from your teacher
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border-[2px] border-red-400 rounded-[10px] animate-[fadeInScale_0.3s_ease-out_forwards]">
                    <p className="font-quicksand font-bold text-red-600 text-[12px] text-center">
                      {error}
                    </p>
                  </div>
                )}

                {/* Join Button */}
                <button
                  onClick={handleJoinGame}
                  disabled={gameCode.length !== 6 || isJoining}
                  className={`w-full h-[56px] rounded-[14px] font-quicksand font-bold text-[18px] text-white transition-all duration-300 border-[3px] flex items-center justify-center gap-2 ${
                    gameCode.length === 6 && !isJoining
                      ? 'bg-[#96b902] hover:bg-[#7a9700] border-[#006029] cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95'
                      : 'bg-[#d3d3d3] border-[#a0a0a0] cursor-not-allowed opacity-60'
                  }`}
                >
                  {isJoining ? (
                    <>
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Join Game
                    </>
                  )}
                </button>

                {/* Sign In Option */}
                <div className="mt-4 text-center">
                  <p className="font-quicksand text-[#a7613c] text-[12px]">
                    Don&apos;t have a code?{' '}
                    <a
                      href="/login"
                      className="font-bold text-[#96b902] hover:text-[#7a9700] underline transition-colors"
                    >
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
