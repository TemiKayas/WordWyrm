'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameMode, Subject } from '@prisma/client';
import { gsap } from 'gsap';

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

const GAME_MODE_LABELS: Record<GameMode, { label: string; icon: 'quiz' | 'tower' | 'snake' }> = {
  TRADITIONAL: { label: 'Quiz', icon: 'quiz' },
  TOWER_DEFENSE: { label: 'Tower Defense', icon: 'tower' },
  SNAKE: { label: 'Snake Game', icon: 'snake' },
};

const SUBJECT_COLORS: Record<Subject, { bg: string; text: string }> = {
  ENGLISH: { bg: 'bg-[#ffc8dc]', text: 'text-[#e42c72]' },
  MATH: { bg: 'bg-[#c8e6ff]', text: 'text-[#2c7ee4]' },
  SCIENCE: { bg: 'bg-[#c8ffd4]', text: 'text-[#2ce447]' },
  HISTORY: { bg: 'bg-[#ffe4c8]', text: 'text-[#e4972c]' },
  LANGUAGE: { bg: 'bg-[#e4c8ff]', text: 'text-[#972ce4]' },
  GENERAL: { bg: 'bg-[#ffc8dc]', text: 'text-[#e42c72]' },
};

// Snake/Worm icon SVG
const SnakeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="15" viewBox="0 0 13 15" fill="none">
    <path d="M6.5 2.8125C6.5 1.25977 7.74777 0 9.28571 0H10.4C11.8364 0 13 1.1748 13 2.625V11.0156C13 13.2158 11.2328 15 9.05357 15C6.87433 15 5.10714 13.2158 5.10714 11.0156V8.67188C5.10714 8.02441 4.58772 7.5 3.94643 7.5C3.30513 7.5 2.78571 8.02441 2.78571 8.67188V13.5938C2.78571 14.3701 2.16183 15 1.39286 15C0.623884 15 0 14.3701 0 13.5938V8.67188C0 6.47168 1.76719 4.6875 3.94643 4.6875C6.12567 4.6875 7.89286 6.47168 7.89286 8.67188V11.0156C7.89286 11.6631 8.41228 12.1875 9.05357 12.1875C9.69487 12.1875 10.2143 11.6631 10.2143 11.0156V5.625H9.28571C7.74777 5.625 6.5 4.36523 6.5 2.8125ZM10.6786 2.57812C10.6786 2.39164 10.6052 2.2128 10.4746 2.08094C10.344 1.94908 10.1668 1.875 9.98214 1.875C9.79744 1.875 9.6203 1.94908 9.48969 2.08094C9.35909 2.2128 9.28571 2.39164 9.28571 2.57812C9.28571 2.76461 9.35909 2.94345 9.48969 3.07531C9.6203 3.20717 9.79744 3.28125 9.98214 3.28125C10.1668 3.28125 10.344 3.20717 10.4746 3.07531C10.6052 2.94345 10.6786 2.76461 10.6786 2.57812Z" fill="#FFFAF2"/>
  </svg>
);

// Quiz/Pencil icon
const QuizIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Tower Defense/Castle icon
const TowerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21h18M6 21V9l6-6 6 6v12M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Game mode icon selector
const GameModeIcon = ({ mode }: { mode: 'quiz' | 'tower' | 'snake' }) => {
  switch (mode) {
    case 'quiz':
      return <QuizIcon />;
    case 'tower':
      return <TowerIcon />;
    case 'snake':
      return <SnakeIcon />;
  }
};

// Question mark icon
const QuestionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0ZM9 14.4C8.50294 14.4 8.1 13.9971 8.1 13.5C8.1 13.0029 8.50294 12.6 9 12.6C9.49706 12.6 9.9 13.0029 9.9 13.5C9.9 13.9971 9.49706 14.4 9 14.4ZM10.35 9.45C9.9 9.72 9.9 9.81 9.9 10.35V10.8C9.9 11.2971 9.49706 11.7 9 11.7C8.50294 11.7 8.1 11.2971 8.1 10.8V10.35C8.1 8.82 9.27 8.19 9.72 7.92C10.17 7.65 10.17 7.56 10.17 7.02C10.17 6.3726 9.6474 5.85 9 5.85C8.3526 5.85 7.83 6.3726 7.83 7.02C7.83 7.51706 7.42706 7.92 6.93 7.92C6.43294 7.92 6.03 7.51706 6.03 7.02C6.03 5.3802 7.3602 4.05 9 4.05C10.6398 4.05 11.97 5.3802 11.97 7.02C11.97 8.55 10.8 9.18 10.35 9.45Z" fill="#473025"/>
  </svg>
);

// User/Students icon
const UsersIcon = () => (
  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.9476 1.23629C10.1992 0.439038 9.15381 0 8 0C6.84003 0 5.79121 0.436381 5.04624 1.2287C4.29318 2.02974 3.92627 3.11842 4.01242 4.29399C4.18318 6.61326 5.97198 8.49995 8 8.49995C10.028 8.49995 11.8137 6.61364 11.9872 4.29475C12.0745 3.1298 11.7053 2.0434 10.9476 1.23629ZM14.769 16.9999H1.23096C1.05375 17.0022 0.878268 16.9654 0.717263 16.8924C0.556259 16.8193 0.413787 16.7118 0.300212 16.5776C0.0502186 16.2827 -0.0505479 15.8801 0.0240655 15.4729C0.348672 13.6963 1.36172 12.2039 2.95399 11.1562C4.36856 10.2261 6.16044 9.71423 8 9.71423C9.83957 9.71423 11.6314 10.2265 13.046 11.1562C14.6383 12.2035 15.6513 13.6959 15.9759 15.4726C16.0505 15.8797 15.9498 16.2823 15.6998 16.5772C15.5863 16.7115 15.4438 16.8191 15.2828 16.8922C15.1218 16.9653 14.9463 17.0021 14.769 16.9999Z" fill="#473025"/>
  </svg>
);

// Star icon
const StarIcon = () => (
  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0L12.2451 6.90983H19.5106L13.6327 11.1803L15.8779 18.0902L10 13.8197L4.12215 18.0902L6.36729 11.1803L0.489435 6.90983H7.75486L10 0Z" fill="white"/>
  </svg>
);

// Play triangle icon
const PlayIcon = () => (
  <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.409 7.35331C17.8893 7.60872 18.291 7.99 18.5712 8.45629C18.8514 8.92259 18.9994 9.45632 18.9994 10.0003C18.9994 10.5443 18.8514 11.078 18.5712 11.5443C18.291 12.0106 17.8893 12.3919 17.409 12.6473L4.597 19.6143C2.534 20.7373 0 19.2773 0 16.9683V3.03331C0 0.723308 2.534 -0.735693 4.597 0.385307L17.409 7.35331Z" fill="white"/>
  </svg>
);

// Game controller icon (for placeholder)
const GameControllerIcon = () => (
  <svg width="51" height="51" viewBox="0 0 51 51" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M48.1243 24.4422C46.0116 14.8906 42.832 9.7926 38.1155 8.40006C37.1241 8.10921 36.0957 7.96392 35.0625 7.96875C33.6969 7.96875 32.5075 8.30145 31.2495 8.65406C29.7334 9.07939 28.0112 9.5625 25.5 9.5625C22.9888 9.5625 21.2656 9.08039 19.7466 8.65506C18.4875 8.30145 17.2992 7.96875 15.9375 7.96875C14.8691 7.96499 13.8054 8.10982 12.7769 8.39906C8.08529 9.78563 4.90775 14.8816 2.76416 24.4362C0.459199 34.7179 1.59375 41.2094 5.94568 42.7155C6.54222 42.9258 7.16989 43.0342 7.8024 43.0362C10.7837 43.0362 13.1743 40.553 14.8079 38.5199C16.6537 36.219 18.8142 35.0515 25.5 35.0515C31.4716 35.0515 33.9429 35.8614 36.0775 38.5199C37.4193 40.1914 38.6873 41.3608 39.9523 42.0969C41.6347 43.0751 43.3161 43.2922 44.9487 42.7314C47.5206 41.8539 48.9949 39.534 49.3315 35.8345C49.5875 32.9976 49.1931 29.2712 48.1243 24.4422ZM20.7187 23.9063H17.5312V27.0938C17.5312 27.5164 17.3633 27.9218 17.0645 28.2207C16.7656 28.5196 16.3602 28.6875 15.9375 28.6875C15.5148 28.6875 15.1094 28.5196 14.8105 28.2207C14.5117 27.9218 14.3438 27.5164 14.3438 27.0938V23.9063H11.1563C10.7336 23.9063 10.3282 23.7383 10.0293 23.4395C9.73041 23.1406 9.5625 22.7352 9.5625 22.3125C9.5625 21.8898 9.73041 21.4844 10.0293 21.1856C10.3282 20.8867 10.7336 20.7188 11.1563 20.7188H14.3438V17.5313C14.3438 17.1086 14.5117 16.7032 14.8105 16.4043C15.1094 16.1054 15.5148 15.9375 15.9375 15.9375C16.3602 15.9375 16.7656 16.1054 17.0645 16.4043C17.3633 16.7032 17.5312 17.1086 17.5312 17.5313V20.7188H20.7187C21.1414 20.7188 21.5468 20.8867 21.8457 21.1856C22.1446 21.4844 22.3125 21.8898 22.3125 22.3125C22.3125 22.7352 22.1446 23.1406 21.8457 23.4395C21.5468 23.7383 21.1414 23.9063 20.7187 23.9063ZM29.0859 24.3047C28.6919 24.3047 28.3068 24.1878 27.9791 23.9689C27.6515 23.75 27.3962 23.4389 27.2454 23.0749C27.0946 22.7109 27.0552 22.3103 27.132 21.9238C27.2089 21.5374 27.3986 21.1824 27.6772 20.9038C27.9559 20.6252 28.3108 20.4355 28.6973 20.3586C29.0837 20.2817 29.4843 20.3212 29.8483 20.472C30.2123 20.6227 30.5235 20.8781 30.7424 21.2057C30.9613 21.5333 31.0781 21.9185 31.0781 22.3125C31.0781 22.8409 30.8682 23.3476 30.4946 23.7212C30.121 24.0948 29.6143 24.3047 29.0859 24.3047ZM33.4688 28.6875C33.0745 28.6875 32.6892 28.5705 32.3614 28.3514C32.0337 28.1323 31.7784 27.8209 31.6277 27.4565C31.4771 27.0922 31.4379 26.6914 31.5152 26.3048C31.5925 25.9182 31.7827 25.5633 32.0618 25.2849C32.3409 25.0065 32.6964 24.8171 33.0832 24.7408C33.4699 24.6645 33.8706 24.7047 34.2346 24.8562C34.5985 25.0078 34.9093 25.2639 35.1276 25.5921C35.3459 25.9204 35.4619 26.3061 35.4609 26.7003C35.4596 27.2278 35.2491 27.7332 34.8757 28.1058C34.5022 28.4783 33.9963 28.6875 33.4688 28.6875ZM33.4688 19.9219C33.0747 19.9219 32.6896 19.805 32.3619 19.5861C32.0343 19.3672 31.779 19.0561 31.6282 18.6921C31.4774 18.328 31.438 17.9275 31.5148 17.541C31.5917 17.1546 31.7814 16.7996 32.0601 16.521C32.3387 16.2424 32.6936 16.0526 33.0801 15.9758C33.4665 15.8989 33.8671 15.9384 34.2311 16.0891C34.5952 16.2399 34.9063 16.4953 35.1252 16.8229C35.3441 17.1505 35.4609 17.5357 35.4609 17.9297C35.4609 18.458 35.251 18.9648 34.8774 19.3384C34.5038 19.712 33.9971 19.9219 33.4688 19.9219ZM37.8516 24.3047C37.4575 24.3047 37.0724 24.1878 36.7448 23.9689C36.4171 23.75 36.1618 23.4389 36.011 23.0749C35.8602 22.7109 35.8208 22.3103 35.8977 21.9238C35.9745 21.5374 36.1643 21.1824 36.4429 20.9038C36.7215 20.6252 37.0765 20.4355 37.4629 20.3586C37.8494 20.2817 38.2499 20.3212 38.6139 20.472C38.978 20.6227 39.2891 20.8781 39.508 21.2057C39.7269 21.5333 39.8438 21.9185 39.8438 22.3125C39.8438 22.8409 39.6339 23.3476 39.2603 23.7212C38.8866 24.0948 38.3799 24.3047 37.8516 24.3047Z" fill="#C8A787"/>
  </svg>
);

export default function PublicGameCard({ game }: PublicGameCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const favoriteButtonRef = useRef<HTMLButtonElement>(null);

  const handlePlay = () => {
    if (game.gameMode === 'SNAKE') {
      router.push(`/play/snake?gameId=${game.id}`);
    } else if (game.gameMode === 'TOWER_DEFENSE') {
      router.push(`/play/td?gameId=${game.id}`);
    } else {
      router.push(`/play/phaser/${game.shareCode}`);
    }
  };

  const handleFavorite = () => {
    // TODO: Implement favorite functionality
  };

  // 3D button hover animation
  const handleButtonMouseEnter = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        y: -3,
        duration: 0.2,
        ease: 'back.out(2)',
      });
    }
  };

  const handleButtonMouseLeave = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1,
        y: 0,
        duration: 0.15,
        ease: 'power2.out',
      });
    }
  };

  // Card hover animation
  const handleCardMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -4,
        boxShadow: '0 8px 24px rgba(71, 48, 37, 0.15)',
        duration: 0.25,
        ease: 'power2.out',
      });
    }
  };

  const handleCardMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 0,
        boxShadow: 'none',
        duration: 0.2,
        ease: 'power2.out',
      });
    }
  };

  const subjectColors = SUBJECT_COLORS[game.quiz.subject];
  const gameModeInfo = GAME_MODE_LABELS[game.gameMode];

  return (
    <div
      ref={cardRef}
      className="bg-[#fffaf2] rounded-[25px] border-[3px] border-[#e7d6c4] p-[19px] transition-colors hover:border-[#473025]/30"
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
    >
      {/* Game Image/Icon Area */}
      <div className="w-full h-[181px] bg-gradient-to-t from-[#f4e3cf] to-[#f8ecdd] rounded-[12px] border-[3px] border-[#473025] mb-4 flex items-center justify-center overflow-hidden">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.title}
            className="w-full h-full object-cover rounded-[9px]"
          />
        ) : (
          <div className="text-[#473025]/40">
            <GameControllerIcon />
          </div>
        )}
      </div>

      {/* Tags Row */}
      <div className="flex items-center gap-2 mb-3">
        {/* Game Mode Badge */}
        <span className="bg-[#c8a787] rounded-[4px] px-3 py-1 flex items-center gap-1.5 h-[27px]">
          <GameModeIcon mode={gameModeInfo.icon} />
          <span className="font-quicksand font-bold text-[#fffaf2] text-[15px]">
            {gameModeInfo.label}
          </span>
        </span>

        {/* Subject Badge */}
        <span className={`${subjectColors.bg} rounded-[100px] px-3 py-1 h-[27px] flex items-center`}>
          <span className={`font-quicksand font-bold ${subjectColors.text} text-[15px] uppercase`}>
            {game.quiz.subject}
          </span>
        </span>
      </div>

      {/* Game Title */}
      <h3 className="font-quicksand font-bold text-[#473025] text-[20px] leading-tight mb-2 line-clamp-1">
        {game.title}
      </h3>

      {/* Description */}
      <p className="font-quicksand font-bold text-[#bfa183] text-[15px] leading-relaxed mb-4 line-clamp-2 min-h-[45px]">
        {game.description || 'Game description goes here, what it says is up to you.'}
      </p>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <QuestionIcon />
          <span className="font-quicksand font-bold text-[#473025] text-[15px]">
            {game.quiz.numQuestions} Questions
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon />
          <span className="font-quicksand font-bold text-[#473025] text-[15px]">
            {game._count.gameSessions} Students
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Play Button */}
        <button
          ref={playButtonRef}
          onClick={handlePlay}
          onMouseEnter={() => handleButtonMouseEnter(playButtonRef)}
          onMouseLeave={() => handleButtonMouseLeave(playButtonRef)}
          className="bg-[#95b607] border-[2.368px] border-[#006029] rounded-[11.842px] h-[42px] w-[107px] flex items-center justify-center gap-2"
        >
          <PlayIcon />
          <span className="font-quicksand font-bold text-[#fffaf2] text-[20px]">
            Play
          </span>
        </button>

        {/* Favorite Button */}
        <button
          ref={favoriteButtonRef}
          onClick={handleFavorite}
          onMouseEnter={() => handleButtonMouseEnter(favoriteButtonRef)}
          onMouseLeave={() => handleButtonMouseLeave(favoriteButtonRef)}
          className="bg-[#fd9227] border-[2.368px] border-[#730f11] rounded-[11.842px] h-[42px] flex-1 flex items-center justify-center gap-2"
        >
          <StarIcon />
          <span className="font-quicksand font-bold text-[#fffaf2] text-[20px]">
            Favorite
          </span>
        </button>
      </div>
    </div>
  );
}
