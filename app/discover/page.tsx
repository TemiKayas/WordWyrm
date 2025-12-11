'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicGames, PublicGameFilters } from '@/app/actions/game';
import { Subject, GameMode } from '@prisma/client';
import { gsap } from 'gsap';
import Image from 'next/image';
import MainContent from '@/components/discover/MainContent';

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

  // Ref for header animation
  const headerRef = useRef<HTMLDivElement>(null);

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

  // Header animation on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      {/* Simplified Header */}
      <div ref={headerRef} className="border-b-[2px] border-[#473025]/10 py-6 bg-[#fffaf2] relative overflow-visible">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="cursor-pointer mb-4 bg-[#ff8c42] rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-md hover:shadow-lg active:shadow-sm transition-all duration-100 ease-out border-[2px] border-[#cc5921] flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-quicksand font-bold text-white text-[13px] sm:text-[15px]">Back</span>
          </button>

          <h1 className="font-quicksand font-bold text-[#473025] text-[28px] sm:text-[32px] md:text-[36px] mb-2">
            Discover Games
          </h1>
          <p className="font-quicksand text-[#473025]/70 text-[16px] sm:text-[18px]">
            Explore educational games from teachers around the world.
          </p>
        </div>

        {/* Discover Floopa Character - positioned to sit on top */}
        <div className="absolute -bottom-[40px] sm:-bottom-[50px] right-[5%] sm:right-[8%] w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] pointer-events-none z-10 drop-shadow-2xl">
          <Image
            src="/assets/discover/discover-floopa.svg"
            alt="Discover Floopa"
            width={180}
            height={180}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Main Content - Search, Filters, and Games */}
      <MainContent
        search={search}
        setSearch={setSearch}
        subject={subject}
        setSubject={setSubject}
        gameMode={gameMode}
        setGameMode={setGameMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        loading={loading}
        error={error}
        games={games}
      />
    </div>
  );
}
