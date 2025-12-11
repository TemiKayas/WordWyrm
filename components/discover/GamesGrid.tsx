'use client';

import PublicGameCard from '@/components/discover/PublicGameCard';
import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';

type GamesGridProps = {
  loading: boolean;
  error: string;
  games: unknown[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

export default function GamesGrid({ loading, error, games, hasActiveFilters, clearFilters }: GamesGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#473025]/20 border-t-[#ff9f22] mb-4"></div>
          <div className="text-[#473025] font-quicksand font-bold text-lg">
            Loading games...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-[2px] border-red-300 rounded-[20px] p-8 text-center">
        <p className="font-quicksand text-red-700 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-12 text-center">
        <div className="flex justify-center mb-4 text-[#473025]/40">
          <Search size={80} strokeWidth={1.5} />
        </div>
        <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
          No Games Found
        </h3>
        <p className="font-quicksand text-[#473025]/70 text-[16px] mb-6">
          Try adjusting your filters to see more games
        </p>
        {hasActiveFilters && (
          <Button onClick={clearFilters} variant="secondary" size="md">
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(games as Array<{ id: string; [key: string]: unknown }>).map((game) => (
        <PublicGameCard key={game.id} game={game as never} />
      ))}
    </div>
  );
}
