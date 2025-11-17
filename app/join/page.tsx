'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getGameWithQuiz } from '@/app/actions/game';
import RiveAnimation from '@/components/shared/RiveAnimation';
import Button from '@/components/ui/Button';
import { gsap } from 'gsap';

interface GameInfo {
  title: string;
  description: string | null;
  numQuestions: number;
  qrCodeUrl: string | null;
  imageUrl?: string;
}

export default function JoinGamePage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isFetchingGame, setIsFetchingGame] = useState(false);

  // Refs for GSAP animations
  const cardRef = useRef<HTMLDivElement>(null);
  const riveRef = useRef<HTMLDivElement>(null);
  const homeIconRef = useRef<HTMLAnchorElement>(null);
  const ctaBannerRef = useRef<HTMLDivElement>(null);

  // Fetch game info when a complete code is entered
  useEffect(() => {
    const fetchGameInfo = async () => {
      if (gameCode.length === 6) {
        setIsFetchingGame(true);
        setError('');
        try {
          const result = await getGameWithQuiz(gameCode);
          if (result.success) {
            setGameInfo({
              title: result.data.game.title,
              description: result.data.game.description,
              numQuestions: result.data.game.quiz.numQuestions,
              qrCodeUrl: result.data.game.qrCodeUrl,
            });
          } else {
            setGameInfo(null);
            setError('Game not found. Please check the code.');
          }
        } catch (err) {
          setGameInfo(null);
          setError('Failed to load game info.');
        } finally {
          setIsFetchingGame(false);
        }
      } else {
        setGameInfo(null);
      }
    };

    const timer = setTimeout(fetchGameInfo, 500); // Debounce
    return () => clearTimeout(timer);
  }, [gameCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setGameCode(value);
      setError('');
    }
  };

  const handleJoinGame = async () => {
    if (gameCode.length !== 6) {
      setError('Please enter a valid 6-character game code');
      // Shake animation on error
      gsap.to(cardRef.current, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.4,
        ease: 'power2.inOut',
      });
      return;
    }

    setIsJoining(true);
    setError('');

    // Success scale animation
    gsap.to(cardRef.current, {
      scale: 1.05,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    });

    try {
      // Navigate to the game play page
      router.push(`/play/phaser/${gameCode}`);
    } catch (err) {
      setError('Failed to join game. Please try again.');
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gameCode.length === 6) {
      handleJoinGame();
    }
  };

  // GSAP Animations on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate card entrance with bounce
      gsap.from(cardRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
        delay: 0.2,
      });

      // Animate Rive character with floating effect
      gsap.from(riveRef.current, {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Continuous floating animation for Rive character
      gsap.to(riveRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Animate home icon with scale
      gsap.from(homeIconRef.current, {
        scale: 0,
        rotation: -180,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(2)',
        delay: 0.1,
      });

      // Animate CTA banner from bottom
      gsap.from(ctaBannerRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.4,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fffaf2]">
      {/* Background Image Layer */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/assets/join/03079bae0be02c1a42bae6bee5b4f6d75fa6b6a6.png"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Clouds Layer - Positioned exactly as in Figma */}
      <div className="absolute top-[60px] left-0 w-full h-[489px] overflow-hidden">
        <div className="clouds-scroll">
          <Image
            src="/assets/join/64fd0e8d2a67948972b7e4d8737ab10e94e2461a.png"
            alt="Clouds"
            width={3906}
            height={489}
            className="absolute top-0 left-0"
            style={{ maxWidth: 'none' }}
          />
          <Image
            src="/assets/join/64fd0e8d2a67948972b7e4d8737ab10e94e2461a.png"
            alt="Clouds"
            width={3906}
            height={489}
            className="absolute top-0"
            style={{ maxWidth: 'none', left: '3906px' }}
          />
        </div>
      </div>

      {/* Trees Layer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full h-[300px] md:h-[400px] overflow-hidden pointer-events-none z-20">
        <div className="trees-scroll">
          <div
            className="absolute bottom-0 left-0 h-full bg-repeat-x"
            style={{
              backgroundImage: 'url(/assets/join/b380220ff942e7701c851b4026c6050d468d4361.png)',
              backgroundSize: 'auto 100%',
              backgroundPosition: 'bottom left',
              width: '200vw',
            }}
          />
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Home Icon - Top Left */}
        <Link
          ref={homeIconRef}
          href="/"
          className="absolute top-6 left-6 z-30 w-12 h-12 bg-[#fffcf8] border-[3px] border-[#473025] rounded-full flex items-center justify-center hover:bg-[#fff5e8] shadow-md hover:shadow-lg"
          onMouseEnter={() => {
            if (homeIconRef.current) {
              gsap.to(homeIconRef.current, { scale: 1.1, duration: 0.3, ease: 'back.out(2)' });
            }
          }}
          onMouseLeave={() => {
            if (homeIconRef.current) {
              gsap.to(homeIconRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
            }
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#473025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" stroke="#473025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Main Content - Game Card */}
        <div className="flex-1 flex items-center justify-center px-4 pb-24 md:pb-32">
          <div className="w-full max-w-[500px] -mt-16 md:-mt-20">
            {/* Rive Animation */}
            <div ref={riveRef} className="-mb-4">
              <RiveAnimation
                src="/rive/floopafly.riv"
                height="253px"
                className="mx-auto"
              />
            </div>

            <div ref={cardRef} className="bg-[#fffcf8] border-[4px] border-[#473025] rounded-[14px] p-5 md:p-6 shadow-[0px_1.625px_1.625px_0px_rgba(0,0,0,0.25)] relative">

              {/* Game Code Input */}
              <div className="mb-3 md:mb-4">
                <input
                  type="text"
                  value={gameCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-[#fff6e8] border-[4px] border-[#ffb554] rounded-[15px] h-[65px] md:h-[75px] px-4 font-quicksand font-bold text-[24px] md:text-[30px] text-center placeholder:text-[rgba(253,146,39,0.3)] focus:outline-none focus:ring-2 focus:ring-[#96b902]/30 focus:border-[#96b902] hover:border-[#ff9f22] transition-all text-[rgba(253,146,39,0.3)]"
                  style={{ letterSpacing: 'clamp(12px, 4vw, 22px)' }}
                  autoFocus
                />
              </div>

              {/* Helper Text */}
              <p className="font-quicksand font-bold text-[#9b7651] text-[12px] md:text-[13px] text-center mb-3">
                Enter the 6-character code from your instructor.
              </p>

              {/* Dynamic Content Area - Conditionally sized */}
              <div className={`transition-all duration-300 ${(gameInfo || isFetchingGame || error) ? 'min-h-[80px]' : 'min-h-0'}`}>
                {/* Loading State */}
                {isFetchingGame && (
                  <div className="flex flex-col items-center justify-center py-1 mb-3">
                    <svg className="animate-spin h-8 w-8 text-[#96b902] mb-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-quicksand font-bold text-[#473025] text-[13px]">
                      Loading game...
                    </p>
                  </div>
                )}

                {/* Game Info Card (when game is found) */}
                {gameInfo && !isFetchingGame && (
                  <div className="mb-3 bg-gradient-to-br from-[#96b902] to-[#7a9700] border-[3px] border-[#006029] rounded-[8px] p-2 animate-fade-in-scale">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className="font-quicksand font-bold text-white text-[12px]">
                        Game Found!
                      </p>
                    </div>

                    <h2 className="font-quicksand font-bold text-white text-[15px] sm:text-[16px] leading-tight text-center mb-1">
                      {gameInfo.title}
                    </h2>

                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-[6px] px-2 py-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-quicksand font-bold text-white text-[11px]">
                          {gameInfo.numQuestions} Questions
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-[6px] px-2 py-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-quicksand font-bold text-white text-[11px]">
                          Tower Defense
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border-[2px] border-red-400 rounded-[10px] animate-fade-in-scale">
                    <p className="font-quicksand font-bold text-red-600 text-[11px] text-center">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Join Button */}
              <Button
                onClick={handleJoinGame}
                disabled={gameCode.length !== 6 || isJoining}
                variant="success"
                size="lg"
                fullWidth
                isLoading={isJoining}
                icon={
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-90">
                    <path d="M7 0L13.9282 12H0.0717969L7 0Z" fill="white"/>
                  </svg>
                }
                iconPosition="right"
              >
                Join Game
              </Button>

              {/* Sign In Link */}
              <div className="mt-4 text-center">
                <p className="font-quicksand font-bold text-[#9b7651] text-[13px]">
                  Don&apos;t have a code?{' '}
                  <Link
                    href="/login"
                    className="text-[#fd9227] underline hover:text-[#ff9f22] transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom CTA Banner - Fixed at bottom, above trees */}
      <div ref={ctaBannerRef} className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-[592px] px-4">
        <div className="bg-[#fffcf8] rounded-[50px] px-4 md:px-5 py-2 md:py-1.5 shadow-lg border-[2px] border-[#473025]">
          <p className="font-quicksand font-bold text-[#473025] text-[12px] md:text-[15px] text-center leading-tight md:leading-[95.85%]">
            Create your own game and unlock other features for{' '}
            <span className="text-[#7b9900]">FREE</span>
            {' '}at{' '}
            <Link
              href="https://wordwyrm.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fd9227] underline hover:text-[#ff9f22] transition-colors"
            >
              WordWyrm.com
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-clouds {
          0% { transform: translateX(0); }
          100% { transform: translateX(-3906px); }
        }

        @keyframes scroll-trees {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100vw); }
        }

        .clouds-scroll {
          animation: scroll-clouds 80s linear infinite;
          width: 7812px;
          height: 489px;
          position: relative;
        }

        .trees-scroll {
          animation: scroll-trees 30s linear infinite;
          width: 200vw;
          height: 100%;
          position: relative;
        }

        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
