'use client';

import { useRouter } from 'next/navigation';
import { GameMode, Subject } from '@prisma/client';
import { FileText, Castle, Gamepad2, User, HelpCircle, Users } from 'lucide-react';

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
    <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-5 hover:shadow-md hover:border-[#ff9f22]/30 transition-all group">
      {/* Game Image/Icon */}
      <div className="w-full h-48 bg-gradient-to-br from-[#fffaf2] to-[#fff6e8] rounded-[15px] border-2 border-[#473025]/10 mb-4 flex items-center justify-center overflow-hidden group-hover:border-[#ff9f22]/20 transition-all">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-[#473025]/30 group-hover:text-[#ff9f22]/50 transition-colors">
            {game.gameMode === 'SNAKE' ? (
              <Gamepad2 size={72} strokeWidth={1.5} />
            ) : game.gameMode === 'TOWER_DEFENSE' ? (
              <Castle size={72} strokeWidth={1.5} />
            ) : (
              <FileText size={72} strokeWidth={1.5} />
            )}
          </div>
        )}
      </div>

      {/* Tags - Move to top for consistency */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Subject Badge */}
        <span
          className={`font-quicksand text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            SUBJECT_COLORS[game.quiz.subject]
          }`}
        >
          {game.quiz.subject}
        </span>

        {/* Game Mode Badge */}
        <span className="font-quicksand text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#fd9227] text-white border border-[#fd9227]">
          {GAME_MODE_LABELS[game.gameMode]}
        </span>
      </div>

      {/* Game Title - Fixed height for consistency */}
      <h3 className="font-quicksand font-bold text-[#473025] text-[18px] leading-tight mb-2 line-clamp-2 min-h-[3rem]">
        {game.title}
      </h3>

      {/* Description - Fixed height for consistency */}
      <div className="min-h-[2.5rem] mb-3">
        {game.description && (
          <p className="font-quicksand text-[#473025]/70 text-[13px] line-clamp-2">
            {game.description}
          </p>
        )}
      </div>

      {/* Metadata - Compact layout */}
      <div className="space-y-2 mb-4 pb-4 border-b border-[#473025]/10">
        <div className="flex items-center gap-2 text-[#473025]/70 text-[13px]">
          <User size={14} strokeWidth={2} />
          <span className="font-quicksand font-medium truncate">{game.teacher.name}</span>
        </div>
        <div className="flex items-center gap-4 text-[#473025]/60 text-[12px]">
          <span className="flex items-center gap-1.5 font-quicksand">
            <HelpCircle size={13} strokeWidth={2} />
            <span className="font-medium">{game.quiz.numQuestions}</span>
          </span>
          <span className="flex items-center gap-1.5 font-quicksand">
            <Users size={13} strokeWidth={2} />
            <span className="font-medium">{game._count.gameSessions}</span>
          </span>
        </div>
      </div>

      {/* Play Button */}
      <button
        onClick={handlePlay}
        className="w-full bg-[#96b902] border-[3px] border-[#006029] rounded-[15px] h-[44px] font-quicksand font-bold text-white text-[15px] hover:bg-[#a8cc00] transition-all shadow-[0_6px_0_0_#006029] hover:shadow-[0_8px_0_0_#006029] active:shadow-[0_2px_0_0_#006029] hover:-translate-y-0.5 active:translate-y-1 cursor-pointer"
      >
        Play Now
      </button>
    </div>
  );
}
