'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { setUserRole } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button';
import Image from 'next/image';

// Teacher icon
const TeacherIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 6L3 9L12 12L21 9L12 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 15L12 18L21 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12L12 15L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Student icon
const StudentIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function SelectRolePage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const dragonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(dragonRef.current, { y: -50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' });
      gsap.fromTo(cardRef.current, { y: 50, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.15 });
    });
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await setUserRole(selectedRole);
        if (!result.success) {
          setError(result.error);
          if (cardRef.current) {
            gsap.to(cardRef.current, { keyframes: [{ x: -8 }, { x: 8 }, { x: -8 }, { x: 8 }, { x: 0 }], duration: 0.4, ease: 'power2.inOut' });
          }
        } else {
          // Redirect based on role
          const redirectPath = selectedRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
          router.push(redirectPath);
          router.refresh();
        }
      } catch (err) {
        console.error('Role selection error:', err);
        setError('An unexpected error occurred');
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#fffaf2] overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fffaf2] border-b border-[#473025]/10">
        <div className="flex items-center justify-center py-3 px-4">
          <img src="/assets/LearnWyrm.svg" alt="LearnWyrm" className="h-[32px] sm:h-[40px] w-auto" />
        </div>
      </header>

      <div className="min-h-screen pt-16 flex flex-col items-center justify-center p-6">
        <div ref={dragonRef} className="text-center mb-8">
          <Image
            src="/assets/login/welcome-floopa.png"
            alt="WordWyrm mascot"
            width={200}
            height={200}
            className="object-contain mx-auto mb-4"
            priority
          />
          <h2 className="font-quicksand font-bold text-[#473025] text-[28px] mb-3">
            Choose Your Role
          </h2>
          <p className="font-quicksand text-[#473025]/70 text-[16px] max-w-md mx-auto">
            Are you a teacher creating engaging quizzes, or a student ready to learn?
          </p>
        </div>

        <div ref={cardRef} className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
                <span className="font-quicksand text-sm text-red-600">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('TEACHER')}
                className={`bg-[#fffaf2] border-3 rounded-[20px] p-8 transition-all duration-200 hover:scale-105 ${
                  selectedRole === 'TEACHER'
                    ? 'border-[#fd9227] shadow-lg'
                    : 'border-[#473025] hover:border-[#fd9227]/50'
                }`}
              >
                <div className={`flex flex-col items-center space-y-4 ${selectedRole === 'TEACHER' ? 'text-[#fd9227]' : 'text-[#473025]'}`}>
                  <TeacherIcon />
                  <div className="text-center">
                    <h3 className="font-quicksand font-bold text-[20px] mb-2">Teacher</h3>
                    <p className="font-quicksand text-[14px] opacity-70">
                      Create quizzes and track student progress
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`bg-[#fffaf2] border-3 rounded-[20px] p-8 transition-all duration-200 hover:scale-105 ${
                  selectedRole === 'STUDENT'
                    ? 'border-[#fd9227] shadow-lg'
                    : 'border-[#473025] hover:border-[#fd9227]/50'
                }`}
              >
                <div className={`flex flex-col items-center space-y-4 ${selectedRole === 'STUDENT' ? 'text-[#fd9227]' : 'text-[#473025]'}`}>
                  <StudentIcon />
                  <div className="text-center">
                    <h3 className="font-quicksand font-bold text-[20px] mb-2">Student</h3>
                    <p className="font-quicksand text-[14px] opacity-70">
                      Join classes and play educational games
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isPending || !selectedRole}
                className="min-w-[200px]"
              >
                {isPending ? 'Setting up...' : 'Continue'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
