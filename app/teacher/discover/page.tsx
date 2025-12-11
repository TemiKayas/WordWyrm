'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicGames, PublicGameFilters } from '@/app/actions/game';
import { Subject, GameMode } from '@prisma/client';
import Image from 'next/image';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import SearchBar from '@/components/discover/SearchBar';
import FilterControls from '@/components/discover/FilterControls';
import GamesGrid from '@/components/discover/GamesGrid';

export default function DiscoverPage() {
  const [games, setGames] = useState<unknown[]>([]);
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
        <div className="mb-6 relative">
          <h1 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[36px]">
            Discover Public Games
          </h1>
          <p className="font-quicksand text-[#473025]/70 text-[16px] mt-1">
            Explore and play educational games from teachers around the world
          </p>

          {/* Discover Floopa Character - positioned to sit on top */}
          <div className="absolute -top-4 -right-4 sm:-right-8 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] pointer-events-none z-0 drop-shadow-2xl">
            <Image
              src="/assets/discover/discover-floopa.svg"
              alt="Discover Floopa"
              width={140}
              height={140}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-[3px] border-[#473025] rounded-[20px] p-4 md:p-6 mb-6">
          {/* Search Bar */}
          <SearchBar search={search} setSearch={setSearch} />

          {/* Filter Controls */}
          <FilterControls
            subject={subject}
            setSubject={setSubject}
            gameMode={gameMode}
            setGameMode={setGameMode}
            sortBy={sortBy}
            setSortBy={setSortBy}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />
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
        <GamesGrid
          loading={loading}
          error={error}
          games={games}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />
      </div>
    </TeacherPageLayout>
  );
}
