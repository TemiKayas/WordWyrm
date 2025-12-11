'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

interface OnboardingScreen {
  image: string;
  alt: string;
}

interface OnboardingCarouselProps {
  screens: OnboardingScreen[];
  onComplete: () => void;
}

export default function OnboardingCarousel({ screens, onComplete }: OnboardingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastScreen = currentIndex === screens.length - 1;

  const handleContinue = () => {
    if (isLastScreen) {
      onComplete();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center p-4">
      {/* Onboarding Screen Container */}
      <div className="relative w-full max-w-[1280px] h-[720px]">
        <Image
          src={screens[currentIndex].image}
          alt={screens[currentIndex].alt}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-4 mt-8">
        {!isLastScreen && (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSkip}
          >
            Skip
          </Button>
        )}
        <Button
          variant="success"
          size="lg"
          onClick={handleContinue}
          className="min-w-[180px]"
        >
          {isLastScreen ? "Go!" : "Continue"}
        </Button>
      </div>

      {/* Progress Indicators */}
      <div className="flex gap-2 mt-6">
        {screens.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-[#95b607]'
                : 'w-2 bg-[#473025]/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
