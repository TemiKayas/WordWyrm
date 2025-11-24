'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import { getGameWithQuiz } from '@/app/actions/game';

export default function JoinGameWithCodePage() {
  const router = useRouter();
  const params = useParams();
  const shareCode = params.shareCode as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameTitle, setGameTitle] = useState('');

  useEffect(() => {
    async function verifyGame() {
      if (!shareCode || shareCode.length !== 6) {
        setError('Invalid game code');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getGameWithQuiz(shareCode);
        if (result.success) {
          setGameTitle(result.data.game.title);
          // Auto-redirect to game after 2 seconds
          setTimeout(() => {
            router.push(`/play/phaser/${shareCode}`);
          }, 2000);
        } else {
          setError('Game not found. Please check the code and try again.');
          setIsLoading(false);
        }
      } catch {
        setError('Failed to load game. Please try again.');
        setIsLoading(false);
      }
    }

    verifyGame();
  }, [shareCode, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-[150px] h-[150px] mx-auto mb-6 relative animate-bounce">
            <Image
              src="/assets/gaming-floop.png"
              alt="WordWyrm Character"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="font-quicksand font-bold text-[#473025] text-[32px] mb-4">
            {gameTitle ? `Loading ${gameTitle}...` : 'Loading Game...'}
          </h2>
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-[#96b902] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-[#ff9f22] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-[#fd9227] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9]">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white border-[4px] border-[#473025] rounded-[24px] p-8">
            <div className="w-[120px] h-[120px] mx-auto mb-6 relative">
              <Image
                src="/assets/gaming-floop.png"
                alt="WordWyrm Character"
                fill
                className="object-contain opacity-50"
              />
            </div>
            <h1 className="font-quicksand font-bold text-[#473025] text-[36px] mb-4">
              Oops!
            </h1>
            <p className="font-quicksand text-[#a7613c] text-[18px] mb-8">
              {error}
            </p>
            <button
              onClick={() => router.push('/join')}
              className="bg-[#96b902] hover:bg-[#7a9700] text-white font-quicksand font-bold text-[18px] px-8 py-4 rounded-[15px] transition-all border-[3px] border-[#006029]"
            >
              Try Another Code
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
