'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GameCard from './GameCard';
import Image from 'next/image';
import { getTeacherQuizzes, deleteQuiz } from '@/app/actions/quiz';
import { GameMode } from '@prisma/client';

interface Game {
  id: string;
  title: string;
  numQuestions: number;
  pdfFilename: string;
  createdAt: string;
  isDraft?: boolean;
  gameId?: string;
  shareCode?: string;
  hasGame: boolean;
  qrCodeUrl?: string | null;
  gameMode?: GameMode;
}

interface GamesViewProps {
  onCreateGame?: () => void;
  classId?: string;
  hideTitle?: boolean;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 14) return '1 week ago';
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 60) return '1 month ago';
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export default function GamesView({ onCreateGame, classId, hideTitle = false }: GamesViewProps) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      const result = await getTeacherQuizzes(classId);
      if (result.success) {
        const formattedGames = result.data.quizzes.map(quiz => ({
          id: quiz.id,
          title: quiz.title || 'Untitled Quiz',
          numQuestions: quiz.numQuestions,
          pdfFilename: quiz.pdfFilename || 'unknown.pdf',
          createdAt: formatTimeAgo(quiz.createdAt),
          isDraft: !quiz.hasGame,
          gameId: quiz.gameId,
          shareCode: quiz.shareCode,
          hasGame: quiz.hasGame,
          qrCodeUrl: quiz.qrCodeUrl || null,
          gameMode: quiz.gameMode as GameMode | undefined,
        }));
        setGames(formattedGames);
      }
      setLoading(false);
    }
    loadGames();

    // Refresh data when window gains focus (user returns from another page)
    const handleFocus = () => {
      loadGames();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [classId]);

  const recentGames = games.filter(g => g.hasGame);
  const drafts = games.filter(g => !g.hasGame);

  const handlePlay = (game: Game) => {
    if (game.shareCode) {
      router.push(`/play/phaser/${game.shareCode}`);
    }
  };

  const handleEdit = (game: Game) => {
    // Navigate to game edit page
    router.push(`/teacher/games/edit?quizId=${game.id}`);
  };

  // ANALYTICS SYSTEM - Navigate to analytics dashboard for this game
  const handleViewAnalytics = (game: Game) => {
    if (game.gameId) {
      router.push(`/teacher/analytics/${game.gameId}`);
    }
  };

  // Navigate to game preview page with share code/QR
  const handleInfo = (game: Game) => {
    if (game.gameId) {
      router.push(`/teacher/game-preview?gameId=${game.gameId}`);
    }
  };

  const handleDelete = async (game: Game) => {
    if (!confirm(`Are you sure you want to delete "${game.title}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteQuiz(game.id);
    if (result.success) {
      // refresh the games list
      setGames(games.filter(g => g.id !== game.id));
    } else {
      alert(`Failed to delete game: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-quicksand font-bold text-[#473025] text-xl">
          Loading games...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Title and Create Button */}
      {!hideTitle ? (
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-10 gap-4 md:gap-0">
          <h2 className="font-quicksand font-bold text-[#473025] text-[26px] md:text-[30px] lg:text-[34px] text-center md:text-left">
            Your Quizzes and Games
          </h2>
          <button
            onClick={onCreateGame}
            className="justify-center btn-primary bg-[#fd9227] border-[2px] border-[#730f11] rounded-[15px] h-[46px] md:h-[50px] px-5 md:px-7 flex items-center gap-2.5 hover:bg-[#e6832b] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-[18px] h-[18px] md:w-[20px] md:h-[20px] relative flex-shrink-0">
              <Image
                src="/assets/dashboard/create-icon.svg"
                alt="Create"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <span className="font-quicksand font-bold text-white text-[18px] md:text-[20px]">
              Create Game
            </span>
          </button>
        </div>
      ) : (
        <div className="flex justify-end mb-6">
          <button
            onClick={onCreateGame}
            className="justify-center btn-primary bg-[#fd9227] border-[3px] border-[#473025] rounded-[15px] shadow-[0_6px_0_0_#473025] hover:shadow-[0_4px_0_0_#473025] hover:-translate-y-0.5 active:shadow-[0_2px_0_0_#473025] active:translate-y-1 h-[48px] px-6 flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-[20px] h-[20px] relative flex-shrink-0">
              <Image
                src="/assets/dashboard/create-icon.svg"
                alt="Create"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <span className="font-quicksand font-bold text-white text-[18px]">
              Create Game
            </span>
          </button>
        </div>
      )}

      {/* Recently Played Section */}
      {recentGames.length > 0 && (
        <div className="mb-10 md:mb-14">
          <div className="flex items-center justify-between mb-5 md:mb-7">
            <h3 className="font-quicksand font-bold text-[#473025] text-[22px] md:text-[26px]">
              Recently Played
            </h3>
            {recentGames.length > 4 && (
              <button className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] underline hover:text-[#ff9f22] transition-colors cursor-pointer">
                View more
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {recentGames.slice(0, 4).map((game) => (
              <GameCard
                key={game.id}
                {...game}
                onPlay={() => handlePlay(game)}
                onEdit={() => handleEdit(game)}
                onDelete={() => handleDelete(game)}
                onViewAnalytics={() => handleViewAnalytics(game)}
                onInfo={() => handleInfo(game)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div>
          <h3 className="font-quicksand font-bold text-[#473025] text-[22px] md:text-[26px] mb-5 md:mb-7">
            Drafts
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {drafts.map((draft) => (
              <GameCard
                key={draft.id}
                {...draft}
                onEdit={() => handleEdit(draft)}
                onDelete={() => handleDelete(draft)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 md:py-20">
          <p className="font-quicksand font-bold text-[#a7613c] text-lg md:text-xl mb-6 text-center">
            No quizzes yet. Upload a PDF to create your first game!
          </p>
          <button
            onClick={onCreateGame}
            className={hideTitle
              ? "btn-primary bg-[#fd9227] border-[3px] border-[#473025] rounded-[15px] shadow-[0_6px_0_0_#473025] hover:shadow-[0_4px_0_0_#473025] hover:-translate-y-0.5 active:shadow-[0_2px_0_0_#473025] active:translate-y-1 h-[48px] px-8 flex items-center gap-2 transition-all cursor-pointer"
              : "btn-primary bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[15px] h-[44px] px-8 flex items-center gap-2 hover:bg-[#e6832b] cursor-pointer"
            }
          >
            <div className="w-[18px] h-[18px] relative">
              <Image
                src="/assets/dashboard/create-icon.svg"
                alt="Create"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <span className="font-quicksand font-bold text-white text-[20px]">
              Create Your First Game
            </span>
          </button>
        </div>
      )}
    </div>
  );
}