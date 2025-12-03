'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicGames, PublicGameFilters } from '@/app/actions/game';
import PublicGameCard from '@/components/discover/PublicGameCard';
import Button from '@/components/ui/Button';
import { Subject, GameMode } from '@prisma/client';
import { gsap } from 'gsap';

// Search icon
const SearchIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.625 16.625L13.1868 13.1868M13.1868 13.1868C13.7749 12.5987 14.2414 11.9005 14.5597 11.1321C14.878 10.3636 15.0418 9.54006 15.0418 8.70833C15.0418 7.87661 14.878 7.05302 14.5597 6.28461C14.2414 5.51619 13.7749 4.81799 13.1868 4.22988C12.5987 3.64176 11.9005 3.17523 11.1321 2.85695C10.3636 2.53866 9.54006 2.37484 8.70833 2.37484C7.87661 2.37484 7.05302 2.53866 6.28461 2.85695C5.51619 3.17523 4.81799 3.64176 4.22987 4.22988C3.04211 5.41764 2.37484 7.02859 2.37484 8.70833C2.37484 10.3881 3.04211 11.999 4.22987 13.1868C5.41764 14.3746 7.02859 15.0418 8.70833 15.0418C10.3881 15.0418 11.999 14.3746 13.1868 13.1868Z" stroke="#9B7651" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Book icon for subjects
const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20M4 19.5C4 20.163 4.26339 20.7989 4.73223 21.2678C5.20107 21.7366 5.83696 22 6.5 22H20V2H6.5C5.83696 2 5.20107 2.26339 4.73223 2.73223C4.26339 3.20107 4 3.83696 4 4.5V19.5Z" stroke="#C8A787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Game controller icon for game modes
const GameIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12H10M8 10V14M15 13H15.01M18 11H18.01M17.32 5H6.68C5.64 5 4.68 5.56 4.2 6.46L2 10.54C1.52 11.44 2.18 12.5 3.2 12.5H4C4.55 12.5 5 12.95 5 13.5V18.5C5 19.33 5.67 20 6.5 20H7.5C8.33 20 9 19.33 9 18.5V17H15V18.5C15 19.33 15.67 20 16.5 20H17.5C18.33 20 19 19.33 19 18.5V13.5C19 12.95 19.45 12.5 20 12.5H20.8C21.82 12.5 22.48 11.44 22 10.54L19.8 6.46C19.32 5.56 18.36 5 17.32 5Z" stroke="#C8A787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Filter icon
const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5C8.73478 5 8.48043 5.10536 8.29289 5.29289C8.10536 5.48043 8 5.73478 8 6C8 6.26522 8.10536 6.51957 8.29289 6.70711C8.48043 6.89464 8.73478 7 9 7C9.26522 7 9.51957 6.89464 9.70711 6.70711C9.89464 6.51957 10 6.26522 10 6C10 5.73478 9.89464 5.48043 9.70711 5.29289C9.51957 5.10536 9.26522 5 9 5ZM6.17 5C6.3766 4.41447 6.75974 3.90743 7.2666 3.54879C7.77346 3.19015 8.37909 2.99755 9 2.99755C9.62091 2.99755 10.2265 3.19015 10.7334 3.54879C11.2403 3.90743 11.6234 4.41447 11.83 5H19C19.2652 5 19.5196 5.10536 19.7071 5.29289C19.8946 5.48043 20 5.73478 20 6C20 6.26522 19.8946 6.51957 19.7071 6.70711C19.5196 6.89464 19.2652 7 19 7H11.83C11.6234 7.58553 11.2403 8.09257 10.7334 8.45121C10.2265 8.80986 9.62091 9.00245 9 9.00245C8.37909 9.00245 7.77346 8.80986 7.2666 8.45121C6.75974 8.09257 6.3766 7.58553 6.17 7H5C4.73478 7 4.48043 6.89464 4.29289 6.70711C4.10536 6.51957 4 6.26522 4 6C4 5.73478 4.10536 5.48043 4.29289 5.29289C4.48043 5.10536 4.73478 5 5 5H6.17ZM15 11C14.7348 11 14.4804 11.1054 14.2929 11.2929C14.1054 11.4804 14 11.7348 14 12C14 12.2652 14.1054 12.5196 14.2929 12.7071C14.4804 12.8946 14.7348 13 15 13C15.2652 13 15.5196 12.8946 15.7071 12.7071C15.8946 12.5196 16 12.2652 16 12C16 11.7348 15.8946 11.4804 15.7071 11.2929C15.5196 11.1054 15.2652 11 15 11ZM12.17 11C12.3766 10.4145 12.7597 9.90743 13.2666 9.54879C13.7735 9.19014 14.3791 8.99755 15 8.99755C15.6209 8.99755 16.2265 9.19014 16.7334 9.54879C17.2403 9.90743 17.6234 10.4145 17.83 11H19C19.2652 11 19.5196 11.1054 19.7071 11.2929C19.8946 11.4804 20 11.7348 20 12C20 12.2652 19.8946 12.5196 19.7071 12.7071C19.5196 12.8946 19.2652 13 19 13H17.83C17.6234 13.5855 17.2403 14.0926 16.7334 14.4512C16.2265 14.8099 15.6209 15.0025 15 15.0025C14.3791 15.0025 13.7735 14.8099 13.2666 14.4512C12.7597 14.0926 12.3766 13.5855 12.17 13H5C4.73478 13 4.48043 12.8946 4.29289 12.7071C4.10536 12.5196 4 12.2652 4 12C4 11.7348 4.10536 11.4804 4.29289 11.2929C4.48043 11.1054 4.73478 11 5 11H12.17Z" fill="#C8A787"/>
  </svg>
);

// Chevron down icon
const ChevronDownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="#C8A787" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// No results icon
const NoResultsIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M70 70L56.6667 56.6667M56.6667 56.6667C59.5 53.8333 62.3333 49.1667 63.3333 44.1667C64.3333 39.1667 63.8333 34 61.8333 29.3333C59.8333 24.6667 56.5 20.6667 52.3333 18C48.1667 15.3333 43.25 14 38.3333 14C33.4167 14 28.5 15.3333 24.3333 18C20.1667 20.6667 16.8333 24.6667 14.8333 29.3333C12.8333 34 12.3333 39.1667 13.3333 44.1667C14.3333 49.1667 17.1667 53.8333 20 56.6667C25.6667 62.3333 33.5 66 38.3333 66C43.25 66 51 62.3333 56.6667 56.6667Z" stroke="#473025" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function DiscoverPage() {
  const router = useRouter();
  const [games, setGames] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [subject, setSubject] = useState<Subject | ''>('');
  const [gameMode, setGameMode] = useState<GameMode | ''>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'mostPlayed'>('newest');

  // Refs for GSAP animations
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

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

  // GSAP animations on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );

      // Search bar animation
      gsap.fromTo(searchRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.15 }
      );

      // Filters animation
      gsap.fromTo(filtersRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.25 }
      );
    });

    return () => ctx.revert();
  }, []);

  // Animate cards when games change
  useEffect(() => {
    if (!loading && games.length > 0 && cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll('.game-card');
      gsap.fromTo(cards,
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.08,
          ease: 'back.out(1.2)',
        }
      );
    }
  }, [loading, games]);


  return (
    <div className="min-h-screen bg-[#fffaf2]">
      {/* Header */}
      <div ref={headerRef} className="border-b-[2px] border-[#9b7651]/50 py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="back"
            size="sm"
            onClick={() => router.back()}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            className="mb-4"
          >
            Back
          </Button>

          <h1 className="font-quicksand font-bold text-[#473025] text-[32px] leading-[1.2] mb-2">
            Discover Public Games
          </h1>
          <p className="font-quicksand font-bold text-[#bfa183] text-[20px]">
            Explore and play educational games from teachers around the world.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div ref={searchRef} className="bg-[#fffaf2] border-[3px] border-[#473025] rounded-[12px] h-[51px] px-4 flex items-center gap-3 mb-6">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games by titles, teacher, description etc."
            className="flex-1 bg-transparent font-quicksand font-bold text-[#473025] text-[15px] placeholder:text-[#bfa183] focus:outline-none"
          />
        </div>

        {/* Filter Row */}
        <div ref={filtersRef} className="flex flex-wrap items-center gap-4 mb-6">
          {/* Subject Filter */}
          <div className="relative">
            <div className="bg-[#f8ecdd] border-[3px] border-[#c8a787] rounded-[12px] h-[51px] px-4 flex items-center gap-2 min-w-[200px]">
              <BookIcon />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject | '')}
                className="flex-1 bg-transparent font-quicksand font-bold text-[#b88350] text-[15px] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Subjects</option>
                <option value="ENGLISH">English</option>
                <option value="MATH">Math</option>
                <option value="SCIENCE">Science</option>
                <option value="HISTORY">History</option>
                <option value="LANGUAGE">Language</option>
                <option value="GENERAL">General</option>
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          {/* Game Mode Filter */}
          <div className="relative">
            <div className="bg-[#f8ecdd] border-[3px] border-[#c8a787] rounded-[12px] h-[51px] px-4 flex items-center gap-2 min-w-[200px]">
              <GameIcon />
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as GameMode | '')}
                className="flex-1 bg-transparent font-quicksand font-bold text-[#b88350] text-[15px] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Game Modes</option>
                <option value="TRADITIONAL">Traditional Quiz</option>
                <option value="TOWER_DEFENSE">Tower Defense</option>
                <option value="SNAKE">Snake Quiz</option>
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          {/* Sort By Filter */}
          <div className="relative">
            <div className="bg-[#f8ecdd] border-[3px] border-[#c8a787] rounded-[12px] h-[51px] px-4 flex items-center gap-2 min-w-[200px]">
              <FilterIcon />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'mostPlayed')}
                className="flex-1 bg-transparent font-quicksand font-bold text-[#b88350] text-[15px] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="mostPlayed">Most Played</option>
              </select>
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <p className="font-quicksand font-bold text-[#bfa183] text-[15px] mb-4">
            Showing <span className="text-[#473025]">{games.length}</span> games
          </p>
        )}

        {/* Games Grid */}
        <div ref={cardsContainerRef}>
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
                <NoResultsIcon />
              </div>
              <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
                No Games Found
              </h3>
              <p className="font-quicksand text-[#a7613c] text-[16px]">
                Try adjusting your filters to see more games
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(games as Array<{ id: string; [key: string]: unknown }>).map((game) => (
                <div key={game.id} className="game-card">
                  <PublicGameCard game={game as never} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
