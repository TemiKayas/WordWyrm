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
  description?: string;
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
    image: '/assets/onboarding/27f0bc773218feb1f33fcb7da210f02c61215925.png',
    imageAlt: 'AI Floopa',
    imageWidth: 339,
    imageHeight: 352,
    imagePosition: 'right-[50px] bottom-[20px]',
  },
  {
    step: 2,
    title: 'Track Student\nProgress',
    image: '/assets/onboarding/c7d97bc4f08e16c5bf0692b8a1696dd9b6696103.png',
    imageAlt: 'Student Progress',
    imageWidth: 351,
    imageHeight: 364,
    imagePosition: 'right-[30px] bottom-[40px]',
  },
  {
    step: 3,
    title: 'Watch students\neager to learn',
    image: '/assets/dashboard/woah-floopa.png',
    imageAlt: 'Excited Students',
    imageWidth: 200,
    imageHeight: 200,
    imagePosition: 'right-[80px] bottom-[40px]',
    isLastCard: true,
  },
];

const studentCards: OnboardingCard[] = [
  {
    step: 1,
    title: 'Join Games',
    image: '/assets/onboarding/8e89875a574638f8c7324ec764e151aae13edc02.png',
    imageAlt: 'Woah Floopa',
    imageWidth: 475,
    imageHeight: 493,
    imagePosition: 'right-0 bottom-0',
    isLastCard: true,
  },
  {
    step: 2,
    title: 'Earn Coins to\nspend in the Shop!',
    image: '/assets/onboarding/b5537993144d95b93a959b526aa2e8089401a375.png',
    imageAlt: 'Coins',
    imageWidth: 253,
    imageHeight: 108,
    imagePosition: 'left-1/2 -translate-x-1/2 bottom-[100px]',
    showCoins: true,
  },
  {
    step: 3,
    title: 'Learn and\nhave Fun!',
    image: '/assets/onboarding/4e9b715f5084e888d240a18368dbfaab69eb1299.png',
    imageAlt: 'Learning Floopa',
    imageWidth: 341,
    imageHeight: 354,
    imagePosition: 'left-1/2 -translate-x-1/2 bottom-[30px]',
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="relative w-full max-w-[90vw] md:max-w-[1200px] h-[90vh] md:h-[700px] bg-[#fffaf2] rounded-[30px] shadow-[0px_2px_2px_0px_rgba(0,0,0,0.25)] p-4 md:p-0 overflow-hidden"
      >
        {/* Stack of cards in background */}
        <div className="absolute top-[31px] left-1/2 -translate-x-1/2">
          <div className="bg-[#473025] h-[99px] w-[332px] rounded-t-[50px]" />
        </div>

        {/* Main card container */}
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1124px] h-[610px] bg-[#fffaf2] border-4 border-[#473025] rounded-[30px] flex items-center justify-center mt-2">

          {/* Card content */}
          <div
            ref={(el) => {
              cardRefs.current[currentStep] = el;
            }}
            className="relative w-full h-full p-8 flex flex-col items-center"
            style={{ perspective: '1000px' }}
          >
            {/* Welcome header */}
            <p className="absolute top-[-80px] font-quicksand font-bold text-[#fffaf2] text-[20px] text-center">
              Welcome to LearnWyrm!
            </p>

            {/* Step indicator */}
            <div className="absolute top-[30px] left-[50px] flex items-center gap-4">
              <div className="bg-[#95b607] rounded-full w-[82px] h-[82px] flex items-center justify-center">
                <p className="font-quicksand font-bold text-[#fffaf2] text-[50px]">
                  {currentCard.step}
                </p>
              </div>
              <h2 className="font-quicksand font-bold text-[#473025] text-[32px] leading-[1.2] whitespace-pre-line">
                {currentCard.title}
              </h2>
            </div>

            {/* Content card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10%] bg-[#fffaf2] border-4 border-[#473025] rounded-[15px] w-[660px] h-[358px] overflow-hidden">

              {/* Image */}
              {currentCard.image && (
                <div className={`absolute ${currentCard.imagePosition}`}>
                  <Image
                    src={currentCard.image}
                    alt={currentCard.imageAlt}
                    width={currentCard.imageWidth}
                    height={currentCard.imageHeight}
                    className="object-contain"
                  />
                </div>
              )}

              {/* Coins indicator */}
              {currentCard.showCoins && (
                <p className="absolute top-[30%] left-1/2 -translate-x-1/2 font-quicksand font-bold text-[#473025] text-[34px]">
                  +100
                </p>
              )}

              {/* Got it button for last card */}
              {currentCard.isLastCard && (
                <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2">
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    size="lg"
                    className="bg-[#473025] hover:bg-[#5a3d2e] text-[#fffaf2] text-[35px] px-12 py-3 rounded-[21px] border-4 border-[#2d1f18]"
                  >
                    Got it!
                  </Button>
                </div>
              )}
            </div>

            {/* Next button (for non-last cards) */}
            {!currentCard.isLastCard && (
              <div className="absolute bottom-[-80px] right-[50px]">
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="lg"
                  className="bg-[#95b607] hover:bg-[#7a9505] text-[#fffaf2] text-[24px] px-8 py-2"
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 btn btn-circle btn-ghost hover:bg-[#473025]/10 text-[#473025] z-10"
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
      </div>
    </div>
  );
}
