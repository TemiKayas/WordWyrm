'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GameCardProps {
  title: string;
  numQuestions: number;
  pdfFilename: string;
  createdAt: string;
  isDraft?: boolean;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function GameCard({
  title,
  numQuestions,
  pdfFilename,
  createdAt,
  isDraft = false,
  onPlay,
  onEdit,
  onDelete,
}: GameCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    onDelete?.();
    setShowMenu(false);
  };

  const handleChangeTitle = () => {
    // todo: implement change title functionality
    console.log('Change title:', title);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit?.();
    setShowMenu(false);
  };

  return (
    <div className="bg-[#fffcf8] border-4 border-[#473025] rounded-[24px] p-4 md:p-6 relative animate-fade-in">
      {/* three dots menu */}
      <div className="absolute top-4 md:top-6 right-4 md:right-6 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
        >
          <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="2" cy="2" r="2" fill="#473025"/>
            <circle cx="2" cy="8" r="2" fill="#473025"/>
            <circle cx="2" cy="14" r="2" fill="#473025"/>
          </svg>
        </button>

        {/* dropdown menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-[#473025] rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left font-quicksand font-bold text-[#473025] text-sm hover:bg-[#fff5e8] transition-colors cursor-pointer"
            >
              Edit Quiz
            </button>
            <button
              onClick={handleChangeTitle}
              className="w-full px-4 py-2 text-left font-quicksand font-bold text-[#473025] text-sm hover:bg-[#fff5e8] transition-colors cursor-pointer"
            >
              Change Title
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left font-quicksand font-bold text-[#ff4880] text-sm hover:bg-[#fff5e8] transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* game content */}
      <div className="mb-3 md:mb-4 pr-6">
        <h3 className="font-quicksand font-bold text-[#473025] text-[18px] md:text-[20px] leading-[95.85%] mb-2 md:mb-3 line-clamp-2">
          {title}
        </h3>

        <div className="font-quicksand font-bold text-[#a7613c] text-[10px] md:text-[11px] leading-[95.85%] space-y-0.5 md:space-y-1">
          <p>{numQuestions} questions</p>
          <p>&nbsp;</p>
          <p className="truncate">{pdfFilename}</p>
          <p>{isDraft ? `Draft Created ${createdAt}` : `Created ${createdAt}`}</p>
        </div>
      </div>

      {/* tower defense icon */}
      <div className="flex justify-center mb-3 md:mb-4">
        <div className="relative w-[140px] h-[80px] md:w-[165px] md:h-[95px]">
          <Image
            src="/assets/dashboard/tower-defense-game-icon.png"
            alt="Tower Defense Game"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* action buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* play or edit game button */}
        {isDraft ? (
          <button
            onClick={onEdit}
            className="btn-primary w-full bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[11px] h-[36px] md:h-[40px] flex items-center justify-center gap-1.5 md:gap-2 hover:bg-[#e6832b] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4087 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.58091 14.5035 3.82612 14.4087 4.05493C14.314 4.28375 14.1751 4.49162 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-quicksand font-bold text-white text-[16px] md:text-[20px]">
              Edit Quiz
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={onPlay}
              className="btn-primary flex-1 bg-[#95b607] border-[1.5px] border-[#006029] rounded-[11px] h-[36px] md:h-[40px] flex items-center justify-center gap-1.5 md:gap-2 hover:bg-[#7a9700] cursor-pointer"
            >
              <div className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] relative flex-shrink-0">
                <Image
                  src="/assets/dashboard/play-icon-small.svg"
                  alt="Play"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-quicksand font-bold text-white text-[16px] md:text-[20px]">
                Play
              </span>
            </button>

            {/* small edit button */}
            <button
              onClick={onEdit}
              className="btn-primary bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[11px] h-[36px] md:h-[40px] w-[36px] md:w-[40px] flex items-center justify-center hover:bg-[#e6832b] cursor-pointer flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4087 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.58091 14.5035 3.82612 14.4087 4.05493C14.314 4.28375 14.1751 4.49162 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}