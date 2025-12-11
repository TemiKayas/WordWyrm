'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import { getTeacherQuizzes } from '@/app/actions/quiz';
import { getTeacherClasses } from '@/app/actions/class';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { Copy, ExternalLink, Search, Maximize2, X, ArrowUpDown, Calendar, Hash } from 'lucide-react';
import ClassSelectionModal from '@/components/shared/ClassSelectionModal';

interface Game {
  id: string;
  title: string;
  shareCode: string;
  qrCodeUrl: string | null;
  imageUrl: string | null;
  gameMode: string;
  numQuestions: number;
  classId: string;
  createdAt: Date;
}

interface ClassWithGames {
  id: string;
  name: string;
  games: Game[];
}

function TeacherGamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classesWithGames, setClassesWithGames] = useState<ClassWithGames[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'questions' | 'code' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fullscreenGame, setFullscreenGame] = useState<Game | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);

  useEffect(() => {
    // Set origin on client side
    setOrigin(window.location.origin);

    async function loadGames() {
      const [classesResult, quizzesResult] = await Promise.all([
        getTeacherClasses(),
        getTeacherQuizzes()
      ]);

      if (quizzesResult.success) {
        const publishedGames = quizzesResult.data.quizzes
          .filter(quiz => quiz.hasGame && quiz.shareCode)
          .map(quiz => ({
            id: quiz.gameId!,
            title: quiz.title || 'Untitled Game',
            shareCode: quiz.shareCode!,
            qrCodeUrl: quiz.qrCodeUrl || null,
            imageUrl: quiz.imageUrl || null,
            gameMode: quiz.gameMode || 'TRADITIONAL',
            numQuestions: quiz.numQuestions,
            classId: quiz.classId || '',
            createdAt: quiz.createdAt,
          }));

        // Group games by class
        const grouped: ClassWithGames[] = [];

        if (classesResult.success) {
          classesResult.data.forEach(classItem => {
            const classGames = publishedGames.filter(game => game.classId === classItem.id);
            if (classGames.length > 0) {
              grouped.push({
                id: classItem.id,
                name: classItem.name,
                games: classGames,
              });
            }
          });
        }

        // Add games without a class to "Other" group
        const unassignedGames = publishedGames.filter(game => !game.classId || game.classId === '');
        if (unassignedGames.length > 0) {
          grouped.push({
            id: 'unassigned',
            name: 'Other Games',
            games: unassignedGames,
          });
        }

        setClassesWithGames(grouped);
      }
      setIsLoading(false);
    }
    loadGames();
  }, []);

  // Check for gameId parameter and auto-open modal
  useEffect(() => {
    const gameId = searchParams.get('gameId');
    if (gameId && classesWithGames.length > 0) {
      // Find the game by ID
      const allGames = classesWithGames.flatMap(c => c.games);
      const game = allGames.find(g => g.id === gameId);
      if (game) {
        setFullscreenGame(game);
        // Remove the gameId parameter from the URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('gameId');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }
    }
  }, [searchParams, classesWithGames, router]);

  const handleCopyCode = (gameId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(gameId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and sort games
  const allGames = classesWithGames.flatMap(c => c.games);
  const filteredGames = allGames
    .filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            game.shareCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === 'all' || game.classId === selectedClass;
      return matchesSearch && matchesClass;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'questions') {
        comparison = a.numQuestions - b.numQuestions;
      } else if (sortBy === 'code') {
        comparison = a.shareCode.localeCompare(b.shareCode);
      } else if (sortBy === 'created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (newSortBy: 'title' | 'questions' | 'code' | 'created') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      // Default to desc for created (newest first), asc for others
      setSortOrder(newSortBy === 'created' ? 'desc' : 'asc');
    }
  };

  const getClassName = (classId: string) => {
    const classItem = classesWithGames.find(c => c.id === classId);
    return classItem?.name || 'Unassigned';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center">
        <div className="w-[200px] h-[200px] mb-6 relative">
          <Image
            src="/assets/dashboard/floopa-character.png"
            alt="Loading"
            width={200}
            height={200}
            className="object-contain animate-bounce"
          />
        </div>
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading games...
        </div>
      </div>
    );
  }

  if (allGames.length === 0) {
    return (
      <TeacherPageLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-[200px] h-[200px] mx-auto mb-6 relative">
            <Image
              src="/assets/dashboard/floopa-character.png"
              alt="No games"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
          <h1 className="font-quicksand font-bold text-[#473025] text-[36px] mb-4">
            No Published Games Yet
          </h1>
          <p className="font-quicksand text-[#a7613c] text-lg mb-8">
            Create and publish a game to share it with your students.
          </p>
          <Button
            onClick={() => setShowClassModal(true)}
            variant="orange"
            size="lg"
          >
            Create Your First Game
          </Button>
        </div>
      </TeacherPageLayout>
    );
  }

  return (
    <>
      <TeacherPageLayout>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          {/* Header with Gaming Floopa */}
          <div className="mb-1">
            <BackButton href="/teacher/dashboard" variant="text">Back to Dashboard</BackButton>
            <div className="flex items-center justify-between mt-4">
              <div>
                <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[40px]">
                  My Games
                </h1>
                <p className="font-quicksand text-[#473025]/70 text-[16px] mt-1">
                  {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'}
                </p>
              </div>
              <div className="hidden md:block">
                <Image
                  src="/assets/gaming-floopa.png"
                  alt="Gaming Floopa"
                  width={240}
                  height={240}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Class Filter Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedClass('all')}
                className={`px-4 py-2 rounded-full font-quicksand font-bold text-[14px] transition-all ${
                  selectedClass === 'all'
                    ? 'bg-[#96b902] text-white border-[2px] border-[#96b902]'
                    : 'bg-white text-[#473025] border-[2px] border-[#473025]/20 hover:border-[#96b902]'
                }`}
              >
                All Classes
              </button>
              {classesWithGames.map(classItem => (
                <button
                  key={classItem.id}
                  onClick={() => setSelectedClass(classItem.id)}
                  className={`px-4 py-2 rounded-full font-quicksand font-bold text-[14px] transition-all ${
                    selectedClass === classItem.id
                      ? 'bg-[#96b902] text-white border-[2px] border-[#96b902]'
                      : 'bg-white text-[#473025] border-[2px] border-[#473025]/20 hover:border-[#96b902]'
                  }`}
                >
                  {classItem.name}
                </button>
              ))}
            </div>

            {/* Search and Sort Row */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#473025]/40" size={20} />
                <input
                  type="text"
                  placeholder="Search by game title or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-[3px] border-[#473025]/20 rounded-[15px] font-quicksand text-[#473025] placeholder:text-[#473025]/40 focus:outline-none focus:border-[#96b902] transition-all"
                />
              </div>

              {/* Sort Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => toggleSort('created')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[15px] font-quicksand font-bold text-[14px] transition-all border-[3px] shadow-sm ${
                    sortBy === 'created'
                      ? 'bg-[#96b902] text-white border-[#96b902] shadow-md'
                      : 'bg-white text-[#473025] border-[#473025]/20 hover:border-[#96b902] hover:shadow-md'
                  }`}
                >
                  <Calendar size={16} className={sortBy === 'created' && sortOrder === 'desc' ? 'rotate-180' : ''} />
                  Created
                </button>
                <button
                  onClick={() => toggleSort('title')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[15px] font-quicksand font-bold text-[14px] transition-all border-[3px] shadow-sm ${
                    sortBy === 'title'
                      ? 'bg-[#96b902] text-white border-[#96b902] shadow-md'
                      : 'bg-white text-[#473025] border-[#473025]/20 hover:border-[#96b902] hover:shadow-md'
                  }`}
                >
                  <ArrowUpDown size={16} className={sortBy === 'title' && sortOrder === 'desc' ? 'rotate-180' : ''} />
                  Name
                </button>
                <button
                  onClick={() => toggleSort('questions')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[15px] font-quicksand font-bold text-[14px] transition-all border-[3px] shadow-sm ${
                    sortBy === 'questions'
                      ? 'bg-[#96b902] text-white border-[#96b902] shadow-md'
                      : 'bg-white text-[#473025] border-[#473025]/20 hover:border-[#96b902] hover:shadow-md'
                  }`}
                >
                  <Hash size={16} className={sortBy === 'questions' && sortOrder === 'desc' ? 'rotate-180' : ''} />
                  Questions
                </button>
                <button
                  onClick={() => toggleSort('code')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[15px] font-quicksand font-bold text-[14px] transition-all border-[3px] shadow-sm ${
                    sortBy === 'code'
                      ? 'bg-[#96b902] text-white border-[#96b902] shadow-md'
                      : 'bg-white text-[#473025] border-[#473025]/20 hover:border-[#96b902] hover:shadow-md'
                  }`}
                >
                  <ArrowUpDown size={16} className={sortBy === 'code' && sortOrder === 'desc' ? 'rotate-180' : ''} />
                  Code
                </button>
              </div>
            </div>
          </div>

          {/* No Results */}
          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <p className="font-quicksand text-[#473025]/60 text-[18px]">
                No games found matching your search
              </p>
            </div>
          )}

          {/* Games List */}
          <div className="space-y-4">
            {filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-[20px] border-[3px] border-[#473025]/20 shadow-md hover:shadow-lg transition-all p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-quicksand font-bold text-[#473025] text-[24px]">
                    {game.title}
                  </h2>
                  {/* Class Badge */}
                  <span className="inline-block mt-1 px-3 py-1 bg-[#ff9f22]/10 border-[2px] border-[#ff9f22] rounded-full font-quicksand font-bold text-[#ff9f22] text-[12px]">
                    {getClassName(game.classId)}
                  </span>
                </div>
                <button
                  onClick={() => setFullscreenGame(game)}
                  className="p-2 rounded-[8px] border-[2px] border-[#96b902] text-[#96b902] hover:bg-[#96b902] hover:text-white transition-all"
                  title="Fullscreen view"
                >
                  <Maximize2 size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="inline-flex items-center gap-2 bg-[#96b902]/10 border-[2px] border-[#96b902] rounded-full px-4 py-2">
                  <span className="font-quicksand font-bold text-[#473025] text-[16px]">
                    {game.numQuestions}
                  </span>
                  <span className="font-quicksand text-[#473025]/70 text-[14px]">
                    Questions
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left/Center: Game Code and Share Link */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Share Code Section with Thumbnail */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-[#fff6e8] border-[3px] border-[#ff9f22] rounded-[15px] p-4">
                      <p className="font-quicksand font-bold text-[#473025] text-[14px] mb-2">
                        Game Code for Students
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="font-quicksand font-bold text-[#473025] text-[32px] tracking-wider">
                          {game.shareCode}
                        </p>
                        <Button
                          onClick={() => handleCopyCode(game.id, game.shareCode)}
                          variant={copiedId === game.id ? "success" : "primary"}
                          size="sm"
                          icon={<Copy size={16} />}
                        >
                          {copiedId === game.id ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    {/* Game Thumbnail */}
                    {game.imageUrl && (
                      <div className="hidden lg:block w-[180px]">
                        <div className="bg-white rounded-[15px] overflow-hidden border-[3px] border-[#473025]/30 h-full">
                          <Image
                            src={game.imageUrl}
                            alt={`${game.title} thumbnail`}
                            width={180}
                            height={120}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Share Link */}
                  <div className="bg-[#fffaf2] border-[2px] border-[#473025]/20 rounded-[12px] p-4">
                    <p className="font-quicksand font-bold text-[#473025] text-[12px] mb-2">
                      Share Link
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${origin}/join/${game.shareCode}`}
                        readOnly
                        className="flex-1 bg-white border-[2px] border-[#473025]/20 rounded-[8px] px-3 py-2 font-quicksand text-[#473025] text-[14px] focus:outline-none"
                      />
                      <Button
                        onClick={() => handleCopyCode(game.id + '-link', `${origin}/join/${game.shareCode}`)}
                        variant={copiedId === game.id + '-link' ? "success" : "orange"}
                        size="sm"
                        icon={<ExternalLink size={16} />}
                      >
                        {copiedId === game.id + '-link' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right: QR Code */}
                <div className="flex flex-col items-center justify-center bg-[#fffaf2] rounded-[15px] border-[3px] border-[#473025]/20 p-6">
                  {game.qrCodeUrl ? (
                    <>
                      <p className="font-quicksand font-bold text-[#473025] text-[14px] mb-3 text-center">
                        Scan to Join
                      </p>
                      <div className="bg-white rounded-[12px] p-4 border-[3px] border-[#473025]/30">
                        <Image
                          src={game.qrCodeUrl}
                          alt={`QR Code for ${game.title}`}
                          width={160}
                          height={160}
                          className="object-contain"
                        />
                      </div>
                      <p className="font-quicksand text-[#473025]/60 text-[12px] mt-3 text-center">
                        Students can scan this
                      </p>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="font-quicksand text-[#473025]/60 text-[14px]">
                        QR Code unavailable
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TeacherPageLayout>

    {/* Share Modal */}
    {fullscreenGame && (
      <div
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setFullscreenGame(null)}
      >
        <div
          className="w-full max-w-2xl bg-white rounded-[20px] shadow-2xl animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#96b902] to-[#7a9700] p-6 relative">
            <button
              onClick={() => setFullscreenGame(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2 className="font-quicksand font-bold text-white text-[24px] pr-10">
              {fullscreenGame.title}
            </h2>
            <p className="font-quicksand text-white/90 text-[14px] mt-1">
              Share this game with your students
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* QR Code and Game Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* QR Code */}
              {fullscreenGame.qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <p className="font-quicksand font-bold text-[#473025] text-[16px] mb-3">
                    Scan QR Code
                  </p>
                  <div className="bg-white rounded-[15px] p-4 border-[3px] border-[#473025]/20">
                    <Image
                      src={fullscreenGame.qrCodeUrl}
                      alt={`QR Code for ${fullscreenGame.title}`}
                      width={180}
                      height={180}
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Game Code */}
              <div className="flex flex-col items-center justify-center">
                <p className="font-quicksand font-bold text-[#473025] text-[16px] mb-3">
                  Or Enter Code
                </p>
                <div className="bg-gradient-to-br from-[#ff9f22] to-[#fd9227] rounded-[15px] p-6 w-full">
                  <p className="font-quicksand font-bold text-white text-[48px] tracking-wider text-center">
                    {fullscreenGame.shareCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Link */}
            <div className="bg-[#fffaf2] border-[2px] border-[#473025]/20 rounded-[15px] p-4 mb-4">
              <p className="font-quicksand font-bold text-[#473025] text-[14px] mb-2">
                Share Link
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${origin}/join/${fullscreenGame.shareCode}`}
                  readOnly
                  className="flex-1 bg-white border-[2px] border-[#473025]/20 rounded-[10px] px-3 py-2 font-quicksand text-[#473025] text-[14px] focus:outline-none"
                />
                <Button
                  onClick={() => handleCopyCode(fullscreenGame.id + '-modal', `${origin}/join/${fullscreenGame.shareCode}`)}
                  variant={copiedId === fullscreenGame.id + '-modal' ? "success" : "orange"}
                  size="sm"
                  icon={<Copy size={16} />}
                >
                  {copiedId === fullscreenGame.id + '-modal' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="font-quicksand text-[#473025]/70 text-[14px]">
                Students can visit <span className="font-bold text-[#96b902]">{origin}/join</span> and enter the code
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Class Selection Modal */}
    <ClassSelectionModal
      isOpen={showClassModal}
      onClose={() => setShowClassModal(false)}
    />
    </>
  );
}

export default function TeacherGamesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center">
        <div className="w-[200px] h-[200px] mb-6 relative">
          <Image
            src="/assets/dashboard/floopa-character.png"
            alt="Loading"
            width={200}
            height={200}
            className="object-contain animate-bounce"
          />
        </div>
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading games...
        </div>
      </div>
    }>
      <TeacherGamesContent />
    </Suspense>
  );
}
