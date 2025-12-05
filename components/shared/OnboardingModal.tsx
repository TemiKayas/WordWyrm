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

interface OnboardingCard {
  step: number;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imagePosition?: string;
  showCoins?: boolean;
  isLastCard?: boolean;
}

const teacherCards: OnboardingCard[] = [
  {
    step: 1,
    title: 'Create Games\nfor your Students',
    description: 'Upload PDFs or create custom quizzes powered by AI. Turn any content into engaging games your students will love!',
    image: '/assets/onboarding/27f0bc773218feb1f33fcb7da210f02c61215925.png',
    imageAlt: 'AI Floopa',
    imageWidth: 220,
    imageHeight: 228,
    imagePosition: 'right-[20px] bottom-[10px]',
  },
  {
    step: 2,
    title: 'Track Student\nProgress',
    description: 'Monitor individual and class performance with detailed analytics. See which questions challenge your students most.',
    image: '/assets/onboarding/c7d97bc4f08e16c5bf0692b8a1696dd9b6696103.png',
    imageAlt: 'Student Progress',
    imageWidth: 228,
    imageHeight: 236,
    imagePosition: 'right-[15px] bottom-[20px]',
  },
  {
    step: 3,
    title: 'Watch students\neager to learn',
    description: 'With gamified learning and instant feedback, students stay motivated and engaged. Learning has never been this fun!',
    image: '/assets/dashboard/woah-floopa.png',
    imageAlt: 'Excited Students',
    imageWidth: 150,
    imageHeight: 150,
    imagePosition: 'right-[50px] bottom-[30px]',
    isLastCard: true,
  },
];

const studentCards: OnboardingCard[] = [
  {
    step: 1,
    title: 'Join Games',
    description: 'Use the game code your teacher gives you to join fun quizzes and challenges. Compete with classmates and test your knowledge!',
    image: '/assets/onboarding/8e89875a574638f8c7324ec764e151aae13edc02.png',
    imageAlt: 'Woah Floopa',
    imageWidth: 280,
    imageHeight: 290,
    imagePosition: 'right-0 bottom-0',
  },
  {
    step: 2,
    title: 'Earn Coins to\nspend in the Shop!',
    description: 'Get rewarded for correct answers and completing games. Collect coins to unlock awesome items and customize your experience!',
    image: '/assets/onboarding/b5537993144d95b93a959b526aa2e8089401a375.png',
    imageAlt: 'Coins',
    imageWidth: 180,
    imageHeight: 77,
    imagePosition: 'left-1/2 -translate-x-1/2 bottom-[80px]',
    showCoins: true,
  },
  {
    step: 3,
    title: 'Learn and\nhave Fun!',
    description: 'Master new topics while having a blast! See your progress, beat your high scores, and become a learning champion!',
    image: '/assets/onboarding/4e9b715f5084e888d240a18368dbfaab69eb1299.png',
    imageAlt: 'Learning Floopa',
    imageWidth: 220,
    imageHeight: 228,
    imagePosition: 'left-1/2 -translate-x-1/2 bottom-[20px]',
    isLastCard: true,
  },
];

export default function OnboardingModal({ isOpen, onClose, userRole }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const cards = userRole === 'TEACHER' ? teacherCards : studentCards;
  const currentCard = cards[currentStep];

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      // Animate modal entrance
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
      }
    }
  }, [isOpen]);

  const handleNext = () => {
    const nextStep = currentStep + 1;

    if (nextStep < cards.length) {
      // Flip out current card
      if (cardRefs.current[currentStep]) {
        gsap.to(cardRefs.current[currentStep], {
          rotateY: 90,
          x: -100,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentStep(nextStep);
          },
        });
      }
    } else {
      // Last card - close modal
      handleClose();
    }
  };

  const handleClose = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          onClose();
        },
      });
    }
  };

  useEffect(() => {
    // Animate card entrance when step changes
    if (cardRefs.current[currentStep] && currentStep > 0) {
      gsap.fromTo(
        cardRefs.current[currentStep],
        { rotateY: -90, x: 100, opacity: 0 },
        { rotateY: 0, x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' }
      );
    }
  }, [currentStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="relative w-full max-w-[90vw] sm:max-w-[600px] md:max-w-[700px] bg-[#fffaf2] rounded-[20px] shadow-xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#473025] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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

        {/* Welcome header */}
        <div className="bg-[#473025] py-4 px-6 rounded-t-[20px]">
          <p className="font-quicksand font-bold text-[#fffaf2] text-[20px] sm:text-[22px] text-center">
            Welcome to LearnWyrm!
          </p>
        </div>

        {/* Card content */}
        <div
          ref={(el) => {
            cardRefs.current[currentStep] = el;
          }}
          className="relative px-6 py-6 sm:px-8 sm:py-8"
          style={{ perspective: '1000px' }}
        >
          {/* Step indicator and title */}
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-[#95b607] rounded-full w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] flex items-center justify-center flex-shrink-0">
              <p className="font-quicksand font-bold text-[#fffaf2] text-[28px] sm:text-[36px]">
                {currentCard.step}
              </p>
            </div>
            <div className="flex-1">
              <h2 className="font-quicksand font-bold text-[#473025] text-[20px] sm:text-[24px] leading-[1.2] whitespace-pre-line mb-2">
                {currentCard.title}
              </h2>
              <p className="font-quicksand text-[#473025] text-[14px] sm:text-[16px] leading-[1.4]">
                {currentCard.description}
              </p>
            </div>
          </div>

          {/* Content card */}
          <div className="relative bg-[#fffaf2] border-3 border-[#473025] rounded-[12px] w-full h-[250px] sm:h-[300px] overflow-hidden mb-4">
            {/* Image */}
            {currentCard.image && (
              <div className={`absolute ${currentCard.imagePosition}`}>
                <Image
                  src={currentCard.image}
                  alt={currentCard.imageAlt}
                  width={currentCard.imageWidth}
                  height={currentCard.imageHeight}
                  className="object-contain max-w-full h-auto"
                />
              </div>
            )}

            {/* Coins indicator */}
            {currentCard.showCoins && (
              <p className="absolute top-[30%] left-1/2 -translate-x-1/2 font-quicksand font-bold text-[#473025] text-[24px] sm:text-[28px]">
                +100
              </p>
            )}

            {/* Got it button for last card */}
            {currentCard.isLastCard && (
              <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="md"
                  className="bg-[#473025] hover:bg-[#5a3d2e] text-[#fffaf2] text-[18px] sm:text-[20px] px-6 sm:px-8"
                >
                  Got it!
                </Button>
              </div>
            )}
          </div>

          {/* Next button (for non-last cards) */}
          {!currentCard.isLastCard && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                variant="success"
                size="md"
                className="text-[16px] sm:text-[18px] px-6"
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
