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
    <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-quicksand font-bold text-[#473025] text-[32px] sm:text-[40px] mb-2">
            Join a Game
          </h1>
          <p className="font-quicksand text-[#a7613c] text-[14px] sm:text-[16px]">
            Enter your game code to start playing
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center flex-1">
          {/* Left Side - Game Code Entry */}
          <div className="order-2 lg:order-1">
            <div className="bg-white border-[3px] border-[#473025] rounded-[18px] p-6 shadow-lg">
              <h2 className="font-quicksand font-bold text-[#473025] text-[20px] mb-4 text-center">
                Enter Game Code
              </h2>

              {/* Game Code Input */}
              <div className="mb-4">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block text-center">
                  Game Code
                </label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[12px] h-[60px] px-4 font-quicksand font-bold text-[#473025] text-[28px] text-center placeholder:text-[#be9f91] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] hover:border-[#ff9f22] transition-all tracking-wider"
                  autoFocus
                />
                <p className="font-quicksand text-[#a7613c] text-[11px] mt-2 text-center">
                  Enter the 6-character code from your teacher
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border-[2px] border-red-400 rounded-[10px]">
                  <p className="font-quicksand font-bold text-red-600 text-[12px] text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoinGame}
                disabled={gameCode.length !== 6 || isJoining}
                className={`w-full h-[50px] rounded-[12px] font-quicksand font-bold text-[18px] text-white transition-all border-[2px] flex items-center justify-center gap-2 ${
                  gameCode.length === 6 && !isJoining
                    ? 'bg-[#96b902] hover:bg-[#7a9700] border-[#006029] cursor-pointer shadow-lg hover:shadow-xl'
                    : 'bg-[#d3d3d3] border-[#a0a0a0] cursor-not-allowed'
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
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Join Game
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-[1px] bg-[#e5d5c6]"></div>
                <span className="font-quicksand text-[#a7613c] text-[12px]">OR</span>
                <div className="flex-1 h-[1px] bg-[#e5d5c6]"></div>
              </div>

              {/* QR Code Scan Info */}
              <div className="bg-[#f1e8d9] rounded-[10px] p-3 text-center">
                <p className="font-quicksand text-[#473025] text-[12px]">
                  Have a QR code? Scan it to join instantly!
                </p>
              </div>
            </div>

            {/* Sign In Option */}
            <div className="mt-4 text-center">
              <p className="font-quicksand text-[#a7613c] text-[12px]">
                Don't have a code?{' '}
                <a
                  href="/login"
                  className="font-bold text-[#96b902] hover:text-[#7a9700] underline transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>

          {/* Right Side - Game Info or Instructions */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border-[3px] border-[#473025] rounded-[18px] p-6 text-center">
              {isFetchingGame ? (
                // Loading state
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#96b902] mb-4"></div>
                  <p className="font-quicksand font-bold text-[#473025] text-[16px]">
                    Loading game info...
                  </p>
                </div>
              ) : gameInfo ? (
                // Game info display
                <div className="space-y-4">
                  {/* Game Image Placeholder */}
                  <div className="w-[150px] h-[150px] mx-auto mb-4 relative rounded-[12px] flex items-center justify-center">
                      <Image
                          src={gameInfo.imageUrl || '/assets/gaming-floop.png'}
                          alt="WordWyrm Character"
                          fill
                          className="object-contain"
                      />
                  </div>

                  {/* Game Title */}
                  <h3 className="font-quicksand font-bold text-[#473025] text-[22px] mb-2">
                    {gameInfo.title}
                  </h3>

                  {/* Game Description */}
                  {gameInfo.description && (
                    <p className="font-quicksand text-[#a7613c] text-[13px] mb-3 line-clamp-3">
                      {gameInfo.description}
                    </p>
                  )}

                  {/* Game Details */}
                  <div className="bg-[#f1e8d9] rounded-[12px] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-quicksand font-bold text-[#473025] text-[13px]">
                        Game Mode:
                      </span>
                      <span className="font-quicksand text-[#473025] text-[13px]">
                        Tower Defense
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-quicksand font-bold text-[#473025] text-[13px]">
                        Questions:
                      </span>
                      <span className="font-quicksand text-[#473025] text-[13px]">
                        {gameInfo.numQuestions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-quicksand font-bold text-[#473025] text-[13px]">
                        Game Code:
                      </span>
                      <span className="font-quicksand font-bold text-[#473025] text-[13px]">
                        {gameCode}
                      </span>
                    </div>
                  </div>

                  {/* Ready indicator */}
                  <div className="bg-[#96b902]/10 border-[2px] border-[#96b902] rounded-[10px] p-3 mt-4">
                    <p className="font-quicksand font-bold text-[#96b902] text-[14px]">
                      Ready to join!
                    </p>
                  </div>
                </div>
              ) : (
                // Default instructions
                <>
                  <div className="mb-4">
                    <div className="w-[150px] h-[150px] mx-auto mb-4 relative">
                      <Image
                        src="/assets/gaming-floop.png"
                        alt="WordWyrm Character"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-quicksand font-bold text-[#473025] text-[22px] mb-3">
                      Ready to Play?
                    </h3>
                    <p className="font-quicksand text-[#a7613c] text-[14px] mb-4">
                      Join your teacher's game and test your knowledge!
                    </p>
                  </div>

                  <div className="bg-[#f1e8d9] rounded-[12px] p-4 text-left">
                    <h4 className="font-quicksand font-bold text-[#473025] text-[16px] mb-3">
                      How to Join:
                    </h4>
                    <ol className="space-y-2 font-quicksand text-[#473025] text-[12px]">
                      <li className="flex items-start gap-2">
                        <div className="w-[24px] h-[24px] bg-[#96b902] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-white text-[12px]">1</span>
                        </div>
                        <span className="pt-0.5">Get the 6-character code from your teacher</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-[24px] h-[24px] bg-[#96b902] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-white text-[12px]">2</span>
                        </div>
                        <span className="pt-0.5">Enter the code in the box</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-[24px] h-[24px] bg-[#96b902] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-white text-[12px]">3</span>
                        </div>
                        <span className="pt-0.5">Click "Join Game" and start playing!</span>
                      </li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
