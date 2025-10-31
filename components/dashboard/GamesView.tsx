'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GameCard from './GameCard';
import Image from 'next/image';
import { getTeacherQuizzes, deleteQuiz } from '@/app/actions/quiz';

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
}

interface GamesViewProps {
  onCreateGame?: () => void;
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

export default function GamesView({ onCreateGame }: GamesViewProps) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      const result = await getTeacherQuizzes();
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
        }));
        setGames(formattedGames);
      }
      setLoading(false);
    }
    loadGames();
  }, []);

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
      <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-6 md:mb-8 gap-4 md:gap-0">
        <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] lg:text-[32px] text-center md:text-left">
          Your Quizzes and Games
        </h2>
        <button
          onClick={onCreateGame}
          className="justify-center btn-primary bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[15px] h-[40px] md:h-[44px] px-4 md:px-6 flex items-center gap-2 hover:bg-[#e6832b] cursor-pointer"
        >
          <div className="w-[16px] h-[16px] md:w-[18px] md:h-[18px] relative flex-shrink-0">
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

      {/* Recently Played Section */}
      {recentGames.length > 0 && (
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="font-quicksand font-bold text-[#473025] text-[20px] md:text-[24px] leading-[95.85%]">
              Recently Played
            </h3>
            {recentGames.length > 4 && (
              <button className="font-quicksand font-bold text-[#473025] text-[13px] md:text-[15px] underline hover:opacity-70 transition-opacity cursor-pointer">
                View more
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {recentGames.slice(0, 4).map((game) => (
              <GameCard
                key={game.id}
                {...game}
                onPlay={() => handlePlay(game)}
                onEdit={() => handleEdit(game)}
                onDelete={() => handleDelete(game)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div>
          <h3 className="font-quicksand font-bold text-[#473025] text-[20px] md:text-[24px] leading-[95.85%] mb-4 md:mb-6">
            Drafts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
            className="btn-primary bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[15px] h-[44px] px-8 flex items-center gap-2 hover:bg-[#e6832b] cursor-pointer"
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