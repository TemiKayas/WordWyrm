'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GameMode } from '@prisma/client';

import { FileText, Gamepad2, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface GameCardProps {
  title: string;
  numQuestions: number;
  pdfFilename: string;
  createdAt: string;
  isDraft?: boolean;
  imageUrl?: string | null;
  gameMode?: GameMode;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewAnalytics?: () => void;  // ANALYTICS SYSTEM - Navigate to analytics dashboard
  onInfo?: () => void;  // Navigate to game preview page with share code/QR
}

export default function GameCard({
  title,
  numQuestions,
  pdfFilename,
  createdAt,
  isDraft = false,
  imageUrl,
  gameMode = GameMode.TRADITIONAL,
  onPlay,
  onEdit,
  onDelete,
  onViewAnalytics,
  onInfo,
}: GameCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    onDelete?.();
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit?.();
    setShowMenu(false);
  };

  const handleViewAnalytics = () => {
    onViewAnalytics?.();
    setShowMenu(false);
  };

  const handleInfo = () => {
    onInfo?.();
    setShowMenu(false);
  };

  return (
    <div className="bg-[#fffcf8] border-[3px] border-[#473025] rounded-[20px] p-5 md:p-6 relative hover:shadow-lg transition-shadow duration-200">
      {/* three dots menu */}
      <div className="absolute top-4 md:top-5 right-4 md:right-5 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-7 h-7 flex items-center justify-center hover:bg-[#473025]/10 rounded-full transition-all cursor-pointer"
          aria-label="Game options"
        >
          <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="2" cy="2" r="2" fill="#473025"/>
            <circle cx="2" cy="8" r="2" fill="#473025"/>
            <circle cx="2" cy="14" r="2" fill="#473025"/>
          </svg>
        </button>

        {/* dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-44 bg-white border-[3px] border-[#473025] rounded-[12px] shadow-xl overflow-hidden z-20">
              <button
                onClick={handleEdit}
                className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-[14px] hover:bg-[#fff5e8] transition-colors cursor-pointer flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4087 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.58091 14.5035 3.82612 14.4087 4.05493C14.314 4.28375 14.1751 4.49162 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="#473025" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Quiz
              </button>
              {/* Info button - Show share code/QR code for published games */}
              {!isDraft && onInfo && (
                <>
                  <div className="h-[1px] bg-[#473025]/20 mx-2"/>
                  <button
                    onClick={handleInfo}
                    className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-[14px] hover:bg-[#fff5e8] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="#473025" strokeWidth="1.5"/>
                      <path d="M8 11V8M8 5H8.01" stroke="#473025" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Info
                  </button>
                </>
              )}
              {/* ANALYTICS SYSTEM - Show analytics button only for published games (not drafts) */}
              {!isDraft && onViewAnalytics && (
                <>
                  <div className="h-[1px] bg-[#473025]/20 mx-2"/>
                  <button
                    onClick={handleViewAnalytics}
                    className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#95b607] text-[14px] hover:bg-[#fff5e8] transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <BarChart3 size={16} strokeWidth={1.5} className="text-[#95b607]" />
                    View Analytics
                  </button>
                </>
              )}
              <div className="h-[1px] bg-[#473025]/20 mx-2"/>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#ff4880] text-[14px] hover:bg-[#fff5e8] transition-colors cursor-pointer flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="#ff4880" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* game content */}
      <div className="mb-4 pr-8">
        <h3 className="font-quicksand font-bold text-[#473025] text-[19px] md:text-[21px] leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>

        <div className="font-quicksand text-[#a7613c] text-[11px] md:text-[12px] space-y-1.5">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="#a7613c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 4V8L10.6667 9.33333" stroke="#a7613c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold">{numQuestions} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M9.33333 1.33333H4C3.64638 1.33333 3.30724 1.47381 3.05719 1.72386C2.80714 1.97391 2.66667 2.31304 2.66667 2.66667V13.3333C2.66667 13.687 2.80714 14.0261 3.05719 14.2761C3.30724 14.5262 3.64638 14.6667 4 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.687 13.3333 13.3333V5.33333L9.33333 1.33333Z" stroke="#a7613c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.33333 1.33333V5.33333H13.3333" stroke="#a7613c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="truncate font-medium">{pdfFilename}</span>
          </div>
          <div className="flex items-center gap-2 text-[#a7613c]/80">
            <span className="font-medium">{isDraft ? `Draft • ${createdAt}` : `Created ${createdAt}`}</span>
          </div>
        </div>
      </div>

      {/* game image or game mode icon */}
      <div className="flex justify-center mb-4">
        <div className="relative w-full h-[100px] md:h-[110px] rounded-[15px] overflow-hidden bg-gradient-to-br from-[#fff6e8] to-[#ffe9d0] border-2 border-[#473025]/10">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : gameMode === GameMode.SNAKE ? (
            <div className="w-full h-full flex items-center justify-center text-[#473025]">
              <Gamepad2 size={64} strokeWidth={1.5} />
            </div>
          ) : gameMode === GameMode.TOWER_DEFENSE ? (
            <Image
              src="/assets/dashboard/tower-defense-game-icon.png"
              alt="Tower Defense Game"
              fill
              className="object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#473025]">
              <FileText size={64} strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      {/* action buttons */}
      <div className="flex items-center gap-2.5">
        {/* play or edit game button */}
        {isDraft ? (
          <Button
            onClick={onEdit}
            variant="orange"
            size="md"
            fullWidth
            className="h-[44px] md:h-[48px]"
            icon={
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4087 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.58091 14.5035 3.82612 14.4087 4.05493C14.314 4.28375 14.1751 4.49162 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          >
            Edit Quiz
          </Button>
        ) : (
          <>
            <Button
              onClick={onPlay}
              variant="play"
              size="md"
              className="flex-1 h-[44px] md:h-[48px]"
              icon={
                <div className="w-[16px] h-[16px] md:w-[18px] md:h-[18px] relative flex-shrink-0">
                  <Image
                    src="/assets/dashboard/play-icon-small.svg"
                    alt="Play"
                    fill
                    className="object-contain"
                  />
                </div>
              }
            >
              Play
            </Button>

            {/* small edit button */}
            <button
              onClick={onEdit}
              className="bg-[#fd9227] hover:bg-[#ffa447] border-[3px] border-[#cc7425] rounded-[15px] h-[44px] md:h-[48px] w-[44px] md:w-[48px] flex items-center justify-center shadow-[0_6px_0_0] shadow-[#cc7425] active:shadow-[0_2px_0_0] active:translate-y-1 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0] transition-all duration-150 cursor-pointer"
              aria-label="Edit quiz"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4087 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.58091 14.5035 3.82612 14.4087 4.05493C14.314 4.28375 14.1751 4.49162 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}