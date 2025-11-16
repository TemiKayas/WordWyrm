'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicGames, PublicGameFilters } from '@/app/actions/game';
import PublicGameCard from '@/components/discover/PublicGameCard';
import { Subject, GameMode } from '@prisma/client';
import { Search } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      {/* Header */}
      <div className="bg-[#fff6e8] border-b-[3px] border-[#473025] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="bg-[#fd9227] border-[3px] border-[#730f11] rounded-[11px] h-[45px] px-6 flex items-center gap-2 hover:bg-[#e6832b] transition-all mb-4"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-quicksand font-bold text-white text-[16px]">Back</span>
              </button>
              <h1 className="font-quicksand font-bold text-[#473025] text-[42px] sm:text-[52px]">
                Discover Public Games
              </h1>
              <p className="font-quicksand text-[#a7613c] text-[18px] mt-2">
                Explore and play educational games from teachers around the world
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#fff6e8] border-[3px] border-[#473025] rounded-[15px] p-6 sticky top-4">
              <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-4">
                Filters
              </h2>

              {/* Search */}
              <div className="mb-6">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search games..."
                  className="w-full border-[2px] border-[#473025] rounded-[8px] px-4 py-2 font-quicksand text-[14px] bg-white"
                />
              </div>

              {/* Subject Filter */}
              <div className="mb-6">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject | '')}
                  className="w-full border-[2px] border-[#473025] rounded-[8px] px-4 py-2 font-quicksand text-[14px] bg-white"
                >
                  <option value="">All Subjects</option>
                  <option value="ENGLISH">English</option>
                  <option value="MATH">Math</option>
                  <option value="SCIENCE">Science</option>
                  <option value="HISTORY">History</option>
                  <option value="LANGUAGE">Language</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              {/* Game Mode Filter */}
              <div className="mb-6">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                  Game Mode
                </label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as GameMode | '')}
                  className="w-full border-[2px] border-[#473025] rounded-[8px] px-4 py-2 font-quicksand text-[14px] bg-white"
                >
                  <option value="">All Game Modes</option>
                  <option value="TRADITIONAL">Traditional Quiz</option>
                  <option value="TOWER_DEFENSE">Tower Defense</option>
                  <option value="SNAKE">Snake Quiz</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'mostPlayed')}
                  className="w-full border-[2px] border-[#473025] rounded-[8px] px-4 py-2 font-quicksand text-[14px] bg-white"
                >
                  <option value="newest">Newest</option>
                  <option value="mostPlayed">Most Played</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSubject('');
                  setGameMode('');
                  setSearch('');
                  setSortBy('newest');
                }}
                className="w-full bg-[#a7613c] border-[2px] border-[#730f11] rounded-[11px] h-[40px] font-quicksand font-bold text-white text-[14px] hover:bg-[#8e5232] transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Games Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-[#473025] font-quicksand font-bold text-xl">
                  Loading games...
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border-[3px] border-red-400 rounded-[15px] p-6 text-center">
                <p className="font-quicksand text-red-700 text-lg">{error}</p>
              </div>
            ) : games.length === 0 ? (
              <div className="bg-[#fff6e8] border-[3px] border-[#473025] rounded-[15px] p-12 text-center">
                <div className="flex justify-center mb-4 text-[#473025]">
                  <Search size={80} strokeWidth={1.5} />
                </div>
                <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
                  No Games Found
                </h3>
                <p className="font-quicksand text-[#a7613c] text-[16px]">
                  Try adjusting your filters to see more games
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-quicksand text-[#473025] font-bold text-[16px]">
                    {games.length} {games.length === 1 ? 'game' : 'games'} found
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {games.map((game) => (
                    <PublicGameCard key={game.id} game={game} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
