'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicGames, PublicGameFilters } from '@/app/actions/game';
import PublicGameCard from '@/components/discover/PublicGameCard';
import { Subject, GameMode } from '@prisma/client';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import { Search, BookOpen, Gamepad2, SlidersHorizontal, X } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function DiscoverPage() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [subject, setSubject] = useState<Subject | ''>('');
  const [gameMode, setGameMode] = useState<GameMode | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'mostPlayed'>('newest');

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      const filters: PublicGameFilters = {};

      if (subject) filters.subject = subject as Subject;
      if (gameMode) filters.gameMode = gameMode as GameMode;
      if (search) filters.search = search;
      filters.sortBy = sortBy;

      const result = await getPublicGames(filters);

      if (result.success) {
        setGames(result.data.games);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };

    fetchGames();
  }, [subject, gameMode, search, sortBy]);

  const hasActiveFilters = subject || gameMode || search || sortBy !== 'newest';

  const clearFilters = () => {
    setSubject('');
    setGameMode('');
    setSearch('');
    setSortBy('newest');
  };

  return (
    <TeacherPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[36px]">
            Discover Public Games
          </h1>
          <p className="font-quicksand text-[#473025]/70 text-[16px] mt-1">
            Explore and play educational games from teachers around the world
          </p>
        </div>

        {/* Filters - Horizontal Layout */}
        <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-4 md:p-6 mb-6">
          {/* Search Bar - Full Width */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#473025]/40" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games by title, teacher, or description..."
                className="w-full h-[50px] pl-12 pr-4 border-[2px] border-[#473025]/20 rounded-[15px] font-quicksand text-[16px] text-[#473025] placeholder:text-[#473025]/40 focus:outline-none focus:border-[#ff9f22] focus:ring-4 focus:ring-[#ff9f22]/20 transition-all bg-[#fffaf2]"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#473025]/60 pointer-events-none z-10" size={18} />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject | '')}
                className="w-full h-[44px] pl-10 pr-10 border-[2px] border-[#473025]/20 rounded-[12px] font-quicksand font-semibold text-[14px] text-[#473025] focus:outline-none focus:border-[#ff9f22] focus:ring-2 focus:ring-[#ff9f22]/20 transition-all bg-[#fffaf2] appearance-none cursor-pointer"
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
                <svg className="w-4 h-4 text-[#473025]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full h-[44px] pl-10 pr-10 border-[2px] border-[#473025]/20 rounded-[12px] font-quicksand font-semibold text-[14px] text-[#473025] focus:outline-none focus:border-[#ff9f22] focus:ring-2 focus:ring-[#ff9f22]/20 transition-all bg-[#fffaf2] appearance-none cursor-pointer"
              >
                <option value="">All Game Modes</option>
                <option value="TRADITIONAL">Traditional Quiz</option>
                <option value="TOWER_DEFENSE">Tower Defense</option>
                <option value="SNAKE">Snake Quiz</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#473025]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full h-[44px] pl-10 pr-10 border-[2px] border-[#473025]/20 rounded-[12px] font-quicksand font-semibold text-[14px] text-[#473025] focus:outline-none focus:border-[#ff9f22] focus:ring-2 focus:ring-[#ff9f22]/20 transition-all bg-[#fffaf2] appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="mostPlayed">Most Played</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#473025]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>

        {/* Results Count */}
        {!loading && !error && games.length > 0 && (
          <div className="mb-4">
            <p className="font-quicksand text-[#473025]/70 text-[14px]">
              Showing <span className="font-bold text-[#473025]">{games.length}</span> {games.length === 1 ? 'game' : 'games'}
            </p>
          </div>
        )}

        {/* Games Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#473025]/20 border-t-[#ff9f22] mb-4"></div>
              <div className="text-[#473025] font-quicksand font-bold text-lg">
                Loading games...
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-[2px] border-red-300 rounded-[20px] p-8 text-center">
            <p className="font-quicksand text-red-700 text-lg font-semibold">{error}</p>
          </div>
        ) : games.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <PublicGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </TeacherPageLayout>
  );
}
