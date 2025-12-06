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
  const logoRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeBoxRef = useRef<HTMLDivElement>(null);
  const gameInfoRef = useRef<HTMLDivElement>(null);
  const joinButtonRef = useRef<HTMLDivElement>(null);

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
        } catch {
          setGameInfo(null);
          setError('Failed to load game info.');
        } finally {
          setIsFetchingGame(false);
        }
      } else {
        setGameInfo(null);
      }
    };

    const timer = setTimeout(fetchGameInfo, 500);
    return () => clearTimeout(timer);
  }, [gameCode]);

  // Animate game info when it appears
  useEffect(() => {
    if (gameInfo && gameInfoRef.current) {
      gsap.fromTo(gameInfoRef.current,
        { scale: 0.9, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }
      );
    }
  }, [gameInfo]);

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
      gsap.to(cardRef.current, {
        keyframes: [
          { x: -8 },
          { x: 8 },
          { x: -8 },
          { x: 8 },
          { x: 0 }
        ],
        duration: 0.4,
        ease: 'power2.inOut',
      });
      return;
    }

    setIsJoining(true);
    setError('');

    // Success animation
    gsap.to(cardRef.current, {
      scale: 1.02,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    });

    try {
      router.push(`/play/phaser/${gameCode}`);
    } catch {
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
      // Logo entrance with bounce
      gsap.fromTo(logoRef.current,
        { y: -40, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)', delay: 0.1 }
      );

      // Rive character flies in from above
      gsap.fromTo(riveRef.current,
        { y: -80, opacity: 0, scale: 0.7, rotation: -10 },
        { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 }
      );

      // Gentle floating for Rive character with slight rotation
      gsap.to(riveRef.current, {
        y: -12,
        rotation: 2,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.95,
      });

      // Card pops up with spring effect
      gsap.fromTo(cardRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', delay: 0.35 }
      );

      // Code input box - no pulse animation, just entrance
      gsap.fromTo(codeBoxRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)', delay: 0.4 }
      );

      // Home icon spins in
      gsap.fromTo(homeIconRef.current,
        { scale: 0, opacity: 0, rotation: -180 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.1 }
      );

      // CTA banner slides up with fade
      gsap.fromTo(ctaBannerRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.6 }
      );

      // Join button entrance
      gsap.fromTo(joinButtonRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)', delay: 0.5 }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fffaf2]">
      {/* Sky Background Layer */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/assets/join/sky.png"
          alt="Sky Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Clouds Layer - Using clouds.png with smaller size */}
      <div className="absolute top-[80px] left-0 w-full h-[200px] overflow-hidden opacity-80">
        <div className="clouds-scroll">
          <Image
            src="/assets/join/clouds.png"
            alt="Clouds"
            width={1200}
            height={200}
            className="absolute top-0 left-0 h-full w-auto"
            style={{ maxWidth: 'none' }}
          />
          <Image
            src="/assets/join/clouds.png"
            alt="Clouds"
            width={1200}
            height={200}
            className="absolute top-0 h-full w-auto"
            style={{ maxWidth: 'none', left: '1200px' }}
          />
          <Image
            src="/assets/join/clouds.png"
            alt="Clouds"
            width={1200}
            height={200}
            className="absolute top-0 h-full w-auto"
            style={{ maxWidth: 'none', left: '2400px' }}
          />
        </div>
      </div>

      {/* Trees Layer */}
      <div className="fixed bottom-0 left-0 w-full h-[250px] md:h-[350px] overflow-hidden pointer-events-none z-20">
        <div className="trees-scroll">
          <div
            className="absolute bottom-0 left-0 h-full bg-repeat-x"
            style={{
              backgroundImage: 'url(/assets/join/trees.png)',
              backgroundSize: 'auto 100%',
              backgroundPosition: 'bottom left',
              width: '200vw',
            }}
          />
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Logo - Top Center */}
        <div className="flex justify-center pt-4">
          <img
            ref={logoRef}
            src="/assets/LearnWyrm.svg"
            alt="LearnWyrm"
            className="h-[32px] sm:h-[36px] w-auto"
          />
        </div>

        {/* Home Icon - Top Left */}
        <Link
          ref={homeIconRef}
          href="/"
          className="absolute top-6 left-6 z-30 w-11 h-11 bg-[#fffcf8] border-[3px] border-[#473025] rounded-full flex items-center justify-center hover:bg-[#fff5e8] shadow-md transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#473025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" stroke="#473025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Main Content - Game Card */}
        <div className="flex-1 flex items-center justify-center px-4 pt-8 md:pt-12 pb-8 md:pb-12">
          <div className="w-full max-w-[380px] md:max-w-[420px] relative">
            {/* Rive Animation - Overlaps the card from behind */}
            <div ref={riveRef} className="absolute left-1/2 -translate-x-1/2 -top-[100px] sm:-top-[130px] md:-top-[160px] z-10 pointer-events-none">
              <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px]">
                <RiveAnimation
                  src="/rive/floopafly.riv"
                  width="100%"
                  height="100%"
                  className="w-full h-full"
                />
              </div>
            </div>

            <div ref={cardRef} className="bg-[#fffcf8] border-[3px] border-[#473025] rounded-[12px] p-4 md:p-5 shadow-lg relative z-20 mt-[100px] sm:mt-[120px] md:mt-[140px]">

              {/* Game Code Input */}
              <div ref={codeBoxRef} className="mb-2 md:mb-3 rounded-[12px]">
                <input
                  ref={inputRef}
                  type="text"
                  value={gameCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[12px] h-[55px] md:h-[60px] px-4 font-quicksand font-bold text-[22px] md:text-[26px] text-center placeholder:text-[rgba(253,146,39,0.3)] focus:outline-none focus:border-[#96b902] hover:border-[#ff9f22] transition-colors text-[#fd9227]"
                  style={{ letterSpacing: 'clamp(10px, 3vw, 18px)' }}
                  autoFocus
                />
              </div>

              {/* Helper Text */}
              <p className="font-quicksand font-bold text-[#9b7651] text-[11px] md:text-[12px] text-center mb-2">
                Enter the 6-character code from your instructor.
              </p>

              {/* Dynamic Content Area - Compact */}
              <div className="overflow-hidden">
                {/* Loading State */}
                {isFetchingGame && (
                  <div className="flex items-center justify-center gap-2 py-2 mb-2">
                    <svg className="animate-spin h-5 w-5 text-[#96b902]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-quicksand font-bold text-[#473025] text-[12px]">
                      Finding game...
                    </p>
                  </div>
                )}

                {/* Game Info - Compact inline design */}
                {gameInfo && !isFetchingGame && (
                  <div ref={gameInfoRef} className="flex items-center gap-3 bg-[#96b902] border-[2px] border-[#006029] rounded-[10px] px-3 py-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-quicksand font-bold text-white text-[14px] truncate">
                        {gameInfo.title}
                      </p>
                      <p className="font-quicksand font-bold text-white/80 text-[11px]">
                        {gameInfo.numQuestions} Questions
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border-[2px] border-red-400 rounded-[10px] px-3 py-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="font-quicksand font-bold text-red-600 text-[12px]">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Join Button */}
              <div ref={joinButtonRef}>
                <Button
                  onClick={handleJoinGame}
                  disabled={gameCode.length !== 6 || isJoining}
                  variant="success"
                  size="md"
                  fullWidth
                  isLoading={isJoining}
                  icon={
                    <svg width="12" height="10" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-90">
                      <path d="M7 0L13.9282 12H0.0717969L7 0Z" fill="white"/>
                    </svg>
                  }
                  iconPosition="right"
                >
                  Join Game
                </Button>
              </div>

              {/* Sign In Link */}
              <div className="mt-3 text-center">
                <p className="font-quicksand font-bold text-[#9b7651] text-[12px]">
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

      {/* Bottom CTA Banner */}
      <div ref={ctaBannerRef} className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[560px] px-4">
        <div className="bg-[#fffcf8] rounded-[50px] px-4 md:px-5 py-2 shadow-lg border-[2px] border-[#473025]">
          <p className="font-quicksand font-bold text-[#473025] text-[11px] md:text-[14px] text-center leading-tight">
            Create your own game and unlock other features for{' '}
            <span className="text-[#7b9900]">FREE</span>
            {' '}at{' '}
            <Link
              href="https://word-wyrm.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fd9227] underline hover:text-[#ff9f22] transition-colors"
            >
              LearnWyrm.com
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-clouds {
          0% { transform: translateX(0); }
          100% { transform: translateX(-1200px); }
        }

        @keyframes scroll-trees {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100vw); }
        }

        .clouds-scroll {
          animation: scroll-clouds 40s linear infinite;
          width: 3600px;
          height: 100%;
          position: relative;
        }

        .trees-scroll {
          animation: scroll-trees 25s linear infinite;
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
