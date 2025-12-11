'use client';

import { BookOpen, Gamepad2, SlidersHorizontal, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Subject, GameMode } from '@prisma/client';

type FilterControlsProps = {
  subject: Subject | '';
  setSubject: (value: Subject | '') => void;
  gameMode: GameMode | '';
  setGameMode: (value: GameMode | '') => void;
  sortBy: 'newest' | 'mostPlayed';
  setSortBy: (value: 'newest' | 'mostPlayed') => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

export default function FilterControls({
  subject,
  setSubject,
  gameMode,
  setGameMode,
  sortBy,
  setSortBy,
  hasActiveFilters,
  clearFilters,
}: FilterControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Subject Filter */}
      <div className="relative">
        <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#473025]/60 pointer-events-none z-10" size={18} />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as Subject | '')}
          className="w-full h-[44px] pl-10 pr-10 border-[3px] border-[#473025] rounded-[12px] font-quicksand font-bold text-[14px] text-[#473025] focus:outline-none focus:border-[#96b902] focus:ring-4 focus:ring-[#96b902]/20 transition-all bg-[#fffaf2] appearance-none cursor-pointer"
        >
          <option value="">All Subjects</option>
          <option value="ENGLISH">English</option>
          <option value="MATH">Math</option>
          <option value="SCIENCE">Science</option>
          <option value="HISTORY">History</option>
          <option value="LANGUAGE">Language</option>
          <option value="GENERAL">General</option>
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-[#473025]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Game Mode Filter */}
      <div className="relative">
        <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#473025]/60 pointer-events-none z-10" size={18} />
        <select
          value={gameMode}
          onChange={(e) => setGameMode(e.target.value as GameMode | '')}
          className="w-full h-[44px] pl-10 pr-10 border-[3px] border-[#473025] rounded-[12px] font-quicksand font-bold text-[14px] text-[#473025] focus:outline-none focus:border-[#96b902] focus:ring-4 focus:ring-[#96b902]/20 transition-all bg-[#fffaf2] appearance-none cursor-pointer"
        >
          <option value="">All Game Modes</option>
          <option value="TRADITIONAL">Traditional Quiz</option>
          <option value="TOWER_DEFENSE">Tower Defense</option>
          <option value="SNAKE">Snake Quiz</option>
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-[#473025]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Sort By */}
      <div className="relative">
        <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#473025]/60 pointer-events-none z-10" size={18} />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'mostPlayed')}
          className="w-full h-[44px] pl-10 pr-10 border-[3px] border-[#473025] rounded-[12px] font-quicksand font-bold text-[14px] text-[#473025] focus:outline-none focus:border-[#96b902] focus:ring-4 focus:ring-[#96b902]/20 transition-all bg-[#fffaf2] appearance-none cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="mostPlayed">Most Played</option>
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-[#473025]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          onClick={clearFilters}
          variant="secondary"
          size="sm"
          icon={<X size={18} />}
          className="h-[44px]"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
