'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import { getTeacherQuizzes } from '@/app/actions/quiz';
import Image from 'next/image';
import dynamic from 'next/dynamic';

interface Game {
  id: string;
  title: string;
  shareCode: string;
  qrCodeUrl: string | null;
  numQuestions: number;
}

export default function TeacherGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Set origin on client side
    setOrigin(window.location.origin);

    async function loadGames() {
      const result = await getTeacherQuizzes();
      if (result.success) {
        const publishedGames = result.data.quizzes
          .filter(quiz => quiz.hasGame && quiz.shareCode)
          .map(quiz => ({
            id: quiz.gameId!,
            title: quiz.title || 'Untitled Game',
            shareCode: quiz.shareCode!,
            qrCodeUrl: quiz.qrCodeUrl || null,
            numQuestions: quiz.numQuestions,
          }));
        setGames(publishedGames);

        // Auto-select first game if available
        if (publishedGames.length > 0) {
          setSelectedGame(publishedGames[0]);
        }
      }
      setIsLoading(false);
    }
    loadGames();
  }, []);

  const handleCopyCode = () => {
    if (selectedGame?.shareCode) {
      navigator.clipboard.writeText(selectedGame.shareCode);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (selectedGame?.shareCode && origin) {
      const link = `${origin}/join/${selectedGame.shareCode}`;
      navigator.clipboard.writeText(link);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading games...
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffaf2]">
        <Navbar showSignOut={true} />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="font-quicksand font-bold text-[#473025] text-[36px] mb-4">
            No Published Games Yet
          </h1>
          <p className="font-quicksand text-[#a7613c] text-lg mb-8">
            Create and publish a game to share it with your students.
          </p>
          <button
            onClick={() => router.push('/teacher/upload')}
            className="bg-[#fd9227] hover:bg-[#e6832b] text-white font-quicksand font-bold text-lg px-8 py-4 rounded-[15px] transition-all border-[3px] border-[#730f11]"
          >
            Create Your First Game
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9] flex flex-col">
      <Navbar showSignOut={true} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-quicksand font-bold text-[#473025] text-[24px] sm:text-[28px] lg:text-[32px]">
            Share Your Game
          </h1>
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="bg-[#fd9227] hover:bg-[#e6832b] text-white font-quicksand font-bold px-4 py-2 text-sm rounded-[12px] transition-all border-[2px] border-[#730f11] flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
          {/* Game Selection Sidebar */}
          <div className="lg:col-span-1 overflow-hidden flex flex-col">
            <div className="bg-white border-[3px] border-[#473025] rounded-[15px] p-4 flex flex-col h-full">
              <h2 className="font-quicksand font-bold text-[#473025] text-[18px] mb-3">
                Select a Game
              </h2>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {games.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full text-left p-3 rounded-[10px] border-[2px] transition-all ${
                      selectedGame?.id === game.id
                        ? 'bg-[#96b902]/10 border-[#96b902]'
                        : 'bg-[#fff6e8] border-[#ffb554] hover:border-[#ff9f22]'
                    }`}
                  >
                    <div className="font-quicksand font-bold text-[#473025] text-[14px] mb-1 truncate">
                      {game.title}
                    </div>
                    <div className="font-quicksand text-[#a7613c] text-[11px]">
                      {game.shareCode} • {game.numQuestions} Qs
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code and Game Code Display */}
          {selectedGame && (
            <div className="lg:col-span-2 overflow-hidden flex flex-col">
              <div className="bg-white border-[3px] border-[#473025] rounded-[15px] p-4 flex flex-col h-full overflow-y-auto">
                <h2 className="font-quicksand font-bold text-[#473025] text-[20px] mb-4 text-center truncate">
                  {selectedGame.title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-1">
                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-[#f1e8d9] rounded-[15px] p-4 mb-2">
                      {selectedGame.qrCodeUrl ? (
                        <Image
                          src={selectedGame.qrCodeUrl}
                          alt="Game QR Code"
                          width={200}
                          height={200}
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-[200px] h-[200px] bg-white rounded-[12px] flex items-center justify-center">
                          <span className="font-quicksand text-[#a7613c] text-center text-sm">
                            QR Code Unavailable
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="font-quicksand text-[#a7613c] text-[12px] text-center">
                      Scan to join instantly
                    </p>
                  </div>

                  {/* Game Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-center mb-3">
                      <p className="font-quicksand font-semibold text-[#a7613c] text-[13px] mb-2">
                        Game Code
                      </p>
                      <div className="bg-[#f1e8d9] border-[3px] border-[#473025] rounded-[15px] px-6 py-4">
                        <p className="font-quicksand font-bold text-[#473025] text-[32px] tracking-wider">
                          {selectedGame.shareCode}
                        </p>
                      </div>
                    </div>

                    <div className="w-full space-y-2">
                      <button
                        onClick={handleCopyCode}
                        className="w-full bg-[#96b902] hover:bg-[#7a9700] text-white font-quicksand font-bold text-[13px] px-4 py-2 rounded-[10px] transition-all border-[2px] border-[#006029] flex items-center justify-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 16H6C5.46957 16 4.96086 15.7893 4.58579 15.4142C4.21071 15.0391 4 14.5304 4 14V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H14C14.5304 4 15.0391 4.21071 15.4142 4.58579C15.7893 4.96086 16 5.46957 16 6V8M10 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V10C20 9.46957 19.7893 8.96086 19.4142 8.58579C19.0391 8.21071 18.5304 8 18 8H10C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10V18C8 18.5304 8.21071 19.0391 8.58579 19.4142C8.96086 19.7893 9.46957 20 10 20Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copy Code
                      </button>

                      <button
                        onClick={handleCopyLink}
                        className="w-full bg-[#ff9f22] hover:bg-[#e6832b] text-white font-quicksand font-bold text-[13px] px-4 py-2 rounded-[10px] transition-all border-[2px] border-[#730f11] flex items-center justify-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997M14 11C13.5705 10.4258 13.0226 9.95078 12.3934 9.60703C11.7642 9.26327 11.0685 9.05885 10.3533 9.00763C9.63819 8.95641 8.92037 9.0596 8.24861 9.31018C7.57685 9.56077 6.96684 9.9529 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.44791 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copy Link
                      </button>
                    </div>

                    {showCopiedFeedback && (
                      <div className="mt-2 bg-[#96b902] text-white font-quicksand font-bold text-xs py-1.5 px-3 rounded-lg text-center animate-fade-in">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="bg-[#f1e8d9] rounded-[12px] p-3">
                  <h3 className="font-quicksand font-bold text-[#473025] text-[14px] mb-2">
                    How Students Join:
                  </h3>
                  <ol className="space-y-1 font-quicksand text-[#473025] text-[12px]">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Visit <span className="font-bold">{origin}/join</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>Enter code: <span className="font-bold">{selectedGame.shareCode}</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>Or scan the QR code</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
