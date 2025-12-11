'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'TEACHER' | 'STUDENT';
}

interface OnboardingScreen {
  image: string;
  alt: string;
  isLastCard?: boolean;
}

const teacherScreens: OnboardingScreen[] = [
  {
    image: '/assets/onboarding/Upload - Teacher.png',
    alt: 'Upload Content - Teachers can upload PDFs and other learning materials',
  },
  {
    image: '/assets/onboarding/Share - Teacher.png',
    alt: 'Share Games - Create and share interactive games with your students',
  },
  {
    image: '/assets/onboarding/Track - Teacher.png',
    alt: 'Track Progress - Monitor student performance and learning outcomes',
    isLastCard: true,
  },
];

const studentScreens: OnboardingScreen[] = [
  {
    image: '/assets/onboarding/Join Games - Student.png',
    alt: 'Join Games - Access fun educational games shared by your teachers',
  },
  {
    image: '/assets/onboarding/Coins - Student.png',
    alt: 'Earn Coins - Collect coins as you play and learn',
  },
  {
    image: '/assets/onboarding/Learn and Have Fun - Student.png',
    alt: 'Learn and Have Fun - Make learning exciting with interactive games',
    isLastCard: true,
  },
];

export default function OnboardingModal({ isOpen, onClose, userRole }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const screens = userRole === 'TEACHER' ? teacherScreens : studentScreens;
  const currentScreen = screens[currentStep];
  const isLastScreen = currentStep === screens.length - 1;

  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      // Animate modal entrance with smoother, more fluid animation
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.9, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out'
          }
        );
      }
    }
  }, [isOpen]);

  const handleNext = () => {
    const nextStep = currentStep + 1;

    if (nextStep < screens.length) {
      // Smooth fade transition
      if (screenRefs.current[currentStep]) {
        gsap.to(screenRefs.current[currentStep], {
          opacity: 0,
          scale: 0.95,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentStep(nextStep);
          },
        });
      }
    } else {
      // Last screen - close modal
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          onClose();
        },
      });
    }
  };

  useEffect(() => {
    // Animate screen entrance when step changes
    if (screenRefs.current[currentStep] && currentStep > 0) {
      gsap.fromTo(
        screenRefs.current[currentStep],
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power3.out',
        }
      );
    }
  }, [currentStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 md:p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="relative w-full max-w-[90vw] md:max-w-[85vw] lg:max-w-[900px] bg-[#fffaf2] rounded-[12px] md:rounded-[20px] shadow-2xl overflow-hidden my-auto mt-16 md:mt-20"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-50 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[#473025] transition-all hover:scale-110 shadow-lg"
          aria-label="Close onboarding"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 md:h-6 md:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Onboarding Screen Image */}
        <div
          ref={(el) => {
            screenRefs.current[currentStep] = el;
          }}
          className="relative w-full aspect-[16/9] max-h-[50vh] md:max-h-[60vh]"
        >
          <Image
            src={currentScreen.image}
            alt={currentScreen.alt}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-center gap-3 md:gap-4 px-4 md:px-6 py-4 md:py-6 bg-[#fffaf2]">
          {!isLastScreen && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleSkip}
              className="text-sm md:text-base"
            >
              Skip
            </Button>
          )}
          <Button
            variant="success"
            size="md"
            onClick={handleNext}
            className="min-w-[140px] md:min-w-[180px] text-sm md:text-base"
          >
            {isLastScreen ? "Go!" : "Continue"}
          </Button>
        </div>

        {/* Progress Indicators */}
        <div className="flex gap-2 justify-center pb-4 md:pb-6">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 md:h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-6 md:w-8 bg-[#95b607]'
                  : 'w-1.5 md:w-2 bg-[#473025]/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
