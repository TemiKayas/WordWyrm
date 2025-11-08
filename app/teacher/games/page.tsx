'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import { getTeacherQuizzes } from '@/app/actions/quiz';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { Copy, ExternalLink, Search, Maximize2, X } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  shareCode: string;
  qrCodeUrl: string | null;
  numQuestions: number;
  classId: string;
}

interface ClassWithGames {
  id: string;
  name: string;
  games: Game[];
}

export default function TeacherGamesPage() {
  const router = useRouter();
  const [classesWithGames, setClassesWithGames] = useState<ClassWithGames[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Set origin on client side
    setOrigin(window.location.origin);

    async function loadGames() {
      const quizzesResult = await getTeacherQuizzes();

      if (quizzesResult.success) {
        const publishedGames = quizzesResult.data.quizzes
          .filter(quiz => quiz.hasGame && quiz.shareCode)
          .map(quiz => ({
            id: quiz.gameId!,
            title: quiz.title || 'Untitled Game',
            shareCode: quiz.shareCode!,
            qrCodeUrl: quiz.qrCodeUrl || null,
            numQuestions: quiz.numQuestions,
            classId: quiz.classId || '',
          }));

        // Show all games in one group
        if (publishedGames.length > 0) {
          setClassesWithGames([{
            id: 'all',
            name: 'All Games',
            games: publishedGames,
          }]);
        }
      }
      setIsLoading(false);
    }
    loadGames();
  }, []);

  const handleCopyCode = (gameId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(gameId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading games...
        </div>
      </div>
    );
  }

  if (classesWithGames.length === 0) {
    return (
      <TeacherPageLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="font-quicksand font-bold text-[#473025] text-[36px] mb-4">
            No Published Games Yet
          </h1>
          <p className="font-quicksand text-[#a7613c] text-lg mb-8">
            Create and publish a game to share it with your students.
          </p>
          <Button
            onClick={() => router.push('/teacher/upload')}
            variant="orange"
            size="lg"
          >
            Create Your First Game
          </Button>
        </div>
      </TeacherPageLayout>
    );
  }

  const allGames = classesWithGames.flatMap(c => c.games);
  const totalGames = allGames.length;

  return (
    <TeacherPageLayout>
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[40px]">
              My Games
            </h1>
            <p className="font-quicksand text-[#473025]/70 text-[16px] mt-1">
              Share these games with your students
            </p>
          </div>
          <BackButton href="/teacher/dashboard" />
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {allGames.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-[20px] border-[3px] border-[#473025]/20 shadow-md hover:shadow-lg transition-all p-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Game Info */}
                <div className="lg:col-span-2">
                  <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-3">
                    {game.title}
                  </h2>

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

                  {/* Share Code Section */}
                  <div className="bg-[#fff6e8] border-[3px] border-[#ff9f22] rounded-[15px] p-4 mb-4">
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
                      <p className="font-quicksand font-bold text-[#473025] text-[16px] mb-3 text-center">
                        Scan to Join
                      </p>
                      <div className="bg-white rounded-[12px] p-4 border-[3px] border-[#473025]/30">
                        <Image
                          src={game.qrCodeUrl}
                          alt={`QR Code for ${game.title}`}
                          width={200}
                          height={200}
                          className="object-contain"
                        />
                      </div>
                      <p className="font-quicksand text-[#473025]/60 text-[12px] mt-3 text-center">
                        Students can scan this QR code to join
                      </p>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="font-quicksand text-[#473025]/60 text-[14px]">
                        QR Code not available
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
  );
}
