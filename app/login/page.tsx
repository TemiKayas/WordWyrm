'use client';

import { useState, useTransition, useRef, useEffect, Suspense } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button';
import Image from 'next/image';

// Google icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.2727 12.5455H26.25V12.5H15V17.5H22.0364C21.0364 20.3182 18.2727 22.5 15 22.5C10.8636 22.5 7.5 19.1364 7.5 15C7.5 10.8636 10.8636 7.5 15 7.5C16.9091 7.5 18.6364 8.22727 19.9545 9.40909L23.4545 5.90909C21.1818 3.77273 18.2273 2.5 15 2.5C8.09091 2.5 2.5 8.09091 2.5 15C2.5 21.9091 8.09091 27.5 15 27.5C21.9091 27.5 27.5 21.9091 27.5 15C27.5 14.1364 27.4091 13.3182 27.2727 12.5455Z" fill="#FFC107"/>
    <path d="M4.04541 9.18182L8.09086 12.1818C9.18177 9.5 11.8636 7.5 15 7.5C16.9091 7.5 18.6364 8.22727 19.9545 9.40909L23.4545 5.90909C21.1818 3.77273 18.2273 2.5 15 2.5C10.1818 2.5 6.04541 5.22727 4.04541 9.18182Z" fill="#FF3D00"/>
    <path d="M15 27.5C18.1364 27.5 21.0455 26.2727 23.2727 24.2273L19.4091 21C18.1818 21.9091 16.6364 22.5 15 22.5C11.7273 22.5 8.95455 20.3182 7.96364 17.5L4 20.6818C5.95455 24.7273 10.1364 27.5 15 27.5Z" fill="#4CAF50"/>
    <path d="M27.2727 12.5455H26.25V12.5H15V17.5H22.0364C21.5682 18.8318 20.7227 20 19.6091 20.8636L19.6136 20.8591L23.4773 24.0909C23.2045 24.3409 27.5 21.25 27.5 15C27.5 14.1364 27.4091 13.3182 27.2727 12.5455Z" fill="#1976D2"/>
  </svg>
);

// Eye closed icon
const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.97 8.97C2.9 10.06 2.1 11.46 1.73 13C3.46 17.44 7.82 20.5 12.93 20.5C14.34 20.5 15.7 20.26 16.96 19.82M8.08 5.18C9.32 4.74 10.67 4.5 12.07 4.5C17.18 4.5 21.54 7.56 23.27 12C22.73 13.45 21.93 14.75 20.93 15.84M1 1L23 23M9.88 9.88C9.32 10.44 9 11.2 9 12C9 13.66 10.34 15 12 15C12.8 15 13.56 14.68 14.12 14.12M12 9C12.8 9 13.56 9.32 14.12 9.88" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Eye open icon
const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const cardRef = useRef<HTMLDivElement>(null);
  const dragonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(dragonRef.current, { x: -50, opacity: 0, scale: 0.9 }, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' });
      gsap.fromTo(cardRef.current, { x: 50, opacity: 0, scale: 0.95 }, { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.15 });
    });
    return () => ctx.revert();
  }, []);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await login(formData, callbackUrl || undefined);
        if (!result.success) {
          setError(result.error);
          if (cardRef.current) {
            gsap.to(cardRef.current, { keyframes: [{ x: -8 }, { x: 8 }, { x: -8 }, { x: 8 }, { x: 0 }], duration: 0.4, ease: 'power2.inOut' });
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('An unexpected error occurred');
      }
    });
  }

  const handleGoogleSignIn = () => {
    // Google sign-in not yet implemented
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fffaf2] border-b border-[#473025]/10">
        <div className="flex items-center justify-center py-3 px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img src="/assets/LearnWyrm.svg" alt="LearnWyrm" className="h-[32px] sm:h-[40px] w-auto" />
          </Link>
        </div>
      </header>

      <div className="min-h-screen pt-16 flex flex-col lg:flex-row max-w-[1200px] mx-auto">
        {/* Mobile character - shown above form on small screens */}
        <div ref={dragonRef} className="lg:hidden flex items-center justify-center bg-[#fffaf2] px-4 py-6">
          <div className="text-center">
            <Image
              src="/assets/login/welcome-floopa.png"
              alt="WordWyrm mascot"
              width={160}
              height={160}
              className="object-contain mx-auto mb-3"
              priority
            />
            <h2 className="font-quicksand font-bold text-[#473025] text-[20px] mb-1">
              Welcome back, learner!
            </h2>
            <p className="font-quicksand text-[#473025]/70 text-[14px] max-w-xs mx-auto">
              Ready to continue your learning adventure? Log in and let&apos;s make learning fun!
            </p>
          </div>
        </div>

        {/* Desktop character - shown on left side on large screens */}
        <div className="hidden lg:flex lg:w-[45%] items-center justify-center bg-[#fffaf2] px-4">
          <div className="text-center">
            <Image
              src="/assets/login/welcome-floopa.png"
              alt="WordWyrm mascot"
              width={280}
              height={280}
              className="object-contain mx-auto mb-4"
              priority
            />
            <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
              Welcome back, learner!
            </h2>
            <p className="font-quicksand text-[#473025]/70 text-[15px] max-w-xs mx-auto">
              Ready to continue your learning adventure? Log in and let&apos;s make learning fun!
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[55%] flex items-center justify-center p-6">
          <div ref={cardRef} className="bg-[#fffaf2] border-3 border-[#473025] shadow-lg w-full max-w-[420px] rounded-[20px]">
            <div className="p-6 sm:p-8">
              <h2 className="font-quicksand font-bold text-[#473025] text-[28px] text-center mb-6">
                Welcome Back!
              </h2>
              <form action={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-2">
                    <span className="font-quicksand text-sm text-red-600">{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="font-quicksand font-bold text-[#473025] text-[14px]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="Enter your Email Address"
                    className="w-full bg-[#fffaf2] border-2 border-[#473025] rounded-[8px] h-[48px] px-4 font-quicksand font-medium text-[#473025] text-[14px] placeholder:text-[#cdac8b] focus:outline-none focus:border-[#fd9227] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="font-quicksand font-bold text-[#473025] text-[14px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#fffaf2] border-2 border-[#473025] rounded-[8px] h-[48px] px-4 pr-11 font-quicksand font-medium text-[#473025] text-[14px] placeholder:text-[#cdac8b] focus:outline-none focus:border-[#fd9227] transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#473025] hover:opacity-70 transition-opacity cursor-pointer">
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="primary" size="lg" fullWidth disabled={isPending}>
                  {isPending ? 'Logging in...' : 'Log In'}
                </Button>
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute w-full h-[1px] bg-[#dfc8a3]"></div>
                  <div className="relative bg-[#fffaf2] px-4">
                    <p className="font-quicksand font-bold text-[#dfc8a3] text-[12px]">OR</p>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="lg" fullWidth onClick={handleGoogleSignIn} icon={<GoogleIcon />}>
                  Continue with Google
                </Button>
                <div className="text-center pt-2">
                  <p className="font-quicksand font-bold text-[#473025] text-[15px]">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-[#fd9227] underline hover:opacity-80 transition-opacity">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
