'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { signup, signInWithGoogle } from '@/app/actions/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button';
import TypingDragon from '@/components/auth/TypingDragon';

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

// Chevron icon
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path d="M6 9L12 15L18 9" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showClassCode, setShowClassCode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const dragonRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(dragonRef.current,
        { x: -50, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }
      );
      gsap.fromTo(cardRef.current,
        { x: 50, opacity: 0, scale: 0.95 },
        { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.15 }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleTyping = () => {
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to reset typing state after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await signup(formData);
        if (!result.success) {
          setError(result.error);
          if (cardRef.current) {
            gsap.to(cardRef.current, {
              keyframes: [{ x: -8 }, { x: 8 }, { x: -8 }, { x: 8 }, { x: 0 }],
              duration: 0.4,
              ease: 'power2.inOut',
            });
          }
        } else if (result.data.message.includes('Please login')) {
          router.push('/login');
        }
      } catch (err) {
        if (err && typeof err === 'object' && 'digest' in err &&
            typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        console.error('Signup error:', err);
        setError('An unexpected error occurred');
      }
    });
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // Server action will handle redirect, so errors here are unexpected
      console.error('Google sign-in error:', error);
    }
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

      <div className="min-h-screen pt-16 flex flex-col lg:flex-row max-w-[1400px] mx-auto">
        {/* Mobile character - shown above form on small screens */}
        <div className="lg:hidden flex items-center justify-center bg-[#fffaf2] px-4 py-4">
          <div className="text-center">
            <div className="scale-[0.70]">
              <TypingDragon isTyping={isTyping} />
            </div>
            <h2 className="font-quicksand font-bold text-[#473025] text-[18px] mb-1">
              Start your journey!
            </h2>
            <p className="font-quicksand text-[#473025]/70 text-[13px] max-w-[280px] mx-auto">
              Join thousands of learners making education fun and engaging. Create your account today!
            </p>
          </div>
        </div>

        {/* Desktop character - shown on left side on large screens */}
        <div className="hidden lg:flex lg:w-[35%] items-center justify-center bg-[#fffaf2] px-4">
          <div className="text-center">
            <div className="scale-90">
              <TypingDragon isTyping={isTyping} />
            </div>
            <h2 className="font-quicksand font-bold text-[#473025] text-[22px] mb-2">
              Start your journey!
            </h2>
            <p className="font-quicksand text-[#473025]/70 text-[14px] max-w-xs mx-auto">
              Join thousands of learners making education fun and engaging. Create your account today!
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[65%] flex items-center justify-center p-4 sm:p-6">
          <div
            ref={cardRef}
            className="bg-[#fffaf2] border-3 border-[#473025] shadow-lg w-full max-w-[95%] sm:max-w-[85%] lg:max-w-[65%] rounded-[20px]"
          >
            <div className="p-6">
              <h2 className="font-quicksand font-bold text-[#473025] text-[28px] text-center mb-4">
                Create Account
              </h2>

              <form action={handleSubmit} className="space-y-2.5">
                {error && (
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-2">
                    <span className="font-quicksand text-sm text-red-600">{error}</span>
                  </div>
                )}

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <label className="font-quicksand font-bold text-[#473025] text-[14px]">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('STUDENT')}
                      className={`p-1.5 rounded-[10px] border-[2px] transition-all ${
                        selectedRole === 'STUDENT'
                          ? 'bg-[#95b607] border-[#006029] text-white shadow-[0_2px_0_0_#006029]'
                          : 'bg-white border-[#473025] text-[#473025] hover:border-[#fd9227]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-quicksand font-bold text-[13px]">Student</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('TEACHER')}
                      className={`p-1.5 rounded-[10px] border-[2px] transition-all ${
                        selectedRole === 'TEACHER'
                          ? 'bg-[#95b607] border-[#006029] text-white shadow-[0_2px_0_0_#006029]'
                          : 'bg-white border-[#473025] text-[#473025] hover:border-[#fd9227]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 11.5V16.5C6 17 8.68629 19 12 19C15.3137 19 18 17 18 16.5V11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-quicksand font-bold text-[13px]">Teacher</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="name" className="font-quicksand font-bold text-[#473025] text-[13px]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Enter your first AND last name"
                    className="w-full bg-[#fffaf2] border-2 border-[#473025] rounded-[8px] h-[42px] px-4 font-quicksand font-medium text-[#473025] text-[14px] placeholder:text-[#cdac8b] focus:outline-none focus:border-[#fd9227] transition-colors"
                    onChange={handleTyping}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="font-quicksand font-bold text-[#473025] text-[13px]">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="Enter your email address"
                    className="w-full bg-[#fffaf2] border-2 border-[#473025] rounded-[8px] h-[42px] px-4 font-quicksand font-medium text-[#473025] text-[14px] placeholder:text-[#cdac8b] focus:outline-none focus:border-[#fd9227] transition-colors"
                    onChange={handleTyping}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="font-quicksand font-bold text-[#473025] text-[13px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full bg-[#fffaf2] border-2 border-[#473025] rounded-[8px] h-[42px] px-4 pr-11 font-quicksand font-medium text-[#473025] text-[14px] placeholder:text-[#cdac8b] focus:outline-none focus:border-[#fd9227] transition-colors"
                      onChange={handleTyping}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#473025] hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                </div>

                <input type="hidden" name="role" value={selectedRole} />

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setShowClassCode(!showClassCode)}
                    className="flex items-center gap-2 font-quicksand font-bold text-[#473025] text-[12px] hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    <ChevronIcon isOpen={showClassCode} />
                    <span>Have a class invite code? (Optional)</span>
                  </button>

                  {showClassCode && (
                    <input
                      type="text"
                      id="classCode"
                      name="classCode"
                      placeholder="Enter class invite code"
                      className="w-full bg-[#fffaf2] border-2 border-[#473025] rounded-[8px] h-[42px] px-4 font-quicksand font-medium text-[#473025] text-[14px] placeholder:text-[#cdac8b] focus:outline-none focus:border-[#fd9227] transition-colors mt-1"
                      onChange={handleTyping}
                    />
                  )}
                </div>

                <div className="pt-1">
                  <Button type="submit" variant="primary" size="lg" fullWidth disabled={isPending}>
                    {isPending ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </div>

                <div className="relative flex items-center justify-center py-1.5">
                  <div className="absolute w-full h-[1px] bg-[#dfc8a3]"></div>
                  <div className="relative bg-[#fffaf2] px-4">
                    <p className="font-quicksand font-bold text-[#dfc8a3] text-[12px]">OR</p>
                  </div>
                </div>

                <Button type="button" variant="secondary" size="lg" fullWidth onClick={handleGoogleSignIn} icon={<GoogleIcon />}>
                  Continue with Google
                </Button>

                <div className="text-center pt-1.5">
                  <p className="font-quicksand font-bold text-[#473025] text-[15px]">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#fd9227] underline hover:opacity-80 transition-opacity">
                      Log In
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
