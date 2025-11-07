'use client';

import { useRouter } from 'next/navigation';
import { GameMode, Subject } from '@prisma/client';

interface PublicGameCardProps {
  game: {
    id: string;
    title: string;
    description: string | null;
    gameMode: GameMode;
    shareCode: string;
    imageUrl: string | null;
    createdAt: Date;
    teacher: {
      name: string;
      school: string | null;
    };
    quiz: {
      subject: Subject;
      numQuestions: number;
    };
    _count: {
      gameSessions: number;
    };
  };
}

const GAME_MODE_LABELS: Record<GameMode, string> = {
  TRADITIONAL: 'Traditional Quiz',
  TOWER_DEFENSE: 'Tower Defense',
  SNAKE: 'Snake Quiz',
};

const SUBJECT_COLORS: Record<Subject, string> = {
  ENGLISH: 'bg-purple-100 text-purple-700 border-purple-300',
  MATH: 'bg-blue-100 text-blue-700 border-blue-300',
  SCIENCE: 'bg-green-100 text-green-700 border-green-300',
  HISTORY: 'bg-orange-100 text-orange-700 border-orange-300',
  LANGUAGE: 'bg-pink-100 text-pink-700 border-pink-300',
  GENERAL: 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function PublicGameCard({ game }: PublicGameCardProps) {
  const router = useRouter();

  const handlePlay = () => {
    // Route to appropriate game page based on game mode
    if (game.gameMode === 'SNAKE') {
      router.push(`/play/snake?gameId=${game.id}`);
    } else if (game.gameMode === 'TOWER_DEFENSE') {
      router.push(`/play/td?gameId=${game.id}`);
    } else {
      router.push(`/play/phaser/${game.shareCode}`);
    }
  };

  return (
    <div className="bg-[#fff6e8] border-[3px] border-[#473025] rounded-[15px] p-6 hover:shadow-lg transition-shadow">
      {/* Game Image/Icon */}
      <div className="w-full h-40 bg-[#fffaf2] rounded-[10px] border-2 border-[#473025] mb-4 flex items-center justify-center overflow-hidden">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl">
            {game.gameMode === 'SNAKE' ? '🐍' : game.gameMode === 'TOWER_DEFENSE' ? '🏰' : '📝'}
          </div>
        )}
      </div>

      {/* Game Title */}
      <h3 className="font-quicksand font-bold text-[#473025] text-[20px] mb-2 line-clamp-2">
        {game.title}
      </h3>

      {/* Description */}
      {game.description && (
        <p className="font-quicksand text-[#a7613c] text-[14px] mb-3 line-clamp-2">
          {game.description}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Subject Badge */}
        <span
          className={`font-quicksand text-[12px] font-bold px-3 py-1 rounded-full border-2 ${
            SUBJECT_COLORS[game.quiz.subject]
          }`}
        >
          {game.quiz.subject}
        </span>

        {/* Game Mode Badge */}
        <span className="font-quicksand text-[12px] font-bold px-3 py-1 rounded-full border-2 bg-[#fd9227] text-white border-[#730f11]">
          {GAME_MODE_LABELS[game.gameMode]}
        </span>
      </div>

      {/* Metadata */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-[#a7613c] text-[14px]">
          <span className="font-quicksand">👨‍🏫 {game.teacher.name}</span>
          {game.teacher.school && (
            <span className="font-quicksand text-[12px]">• {game.teacher.school}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[#a7613c] text-[12px]">
          <span className="font-quicksand">❓ {game.quiz.numQuestions} questions</span>
          <span className="font-quicksand">👥 {game._count.gameSessions} plays</span>
        </div>
      </div>

      {/* Play Button */}
      <button
        onClick={handlePlay}
        className="w-full bg-[#96b902] border-[3px] border-[#006029] rounded-[11px] h-[45px] font-quicksand font-bold text-white text-[16px] hover:bg-[#85a302] transition-all"
      >
        Play Now
      </button>
    </div>
  );
}
