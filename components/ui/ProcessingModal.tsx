'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

interface ProcessingModalProps {
  isOpen: boolean;
  message?: string;
}

export default function ProcessingModal({ isOpen, message = "Creating your quiz..." }: ProcessingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dot1Ref = useRef<HTMLDivElement>(null);
  const dot2Ref = useRef<HTMLDivElement>(null);
  const dot3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const ctx = gsap.context(() => {
      // Fade in modal
      gsap.fromTo(modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );

      // Scale in bubble
      gsap.fromTo(bubbleRef.current,
        { scale: 0, y: 20 },
        { scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)', delay: 0.2 }
      );

      // Animate dots in sequence
      const timeline = gsap.timeline({ repeat: -1 });
      timeline
        .to(dot1Ref.current, { y: -8, duration: 0.4, ease: 'power1.inOut' })
        .to(dot1Ref.current, { y: 0, duration: 0.4, ease: 'power1.inOut' })
        .to(dot2Ref.current, { y: -8, duration: 0.4, ease: 'power1.inOut' }, '-=0.6')
        .to(dot2Ref.current, { y: 0, duration: 0.4, ease: 'power1.inOut' })
        .to(dot3Ref.current, { y: -8, duration: 0.4, ease: 'power1.inOut' }, '-=0.6')
        .to(dot3Ref.current, { y: 0, duration: 0.4, ease: 'power1.inOut' });
    });

    return () => ctx.revert();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0"
    >
      <div className="relative flex flex-col items-center">
        {/* AI Floopa Character */}
        <div className="relative mb-4">
          <Image
            src="/assets/fileupload/ai-floopa.svg"
            alt="AI Assistant"
            width={200}
            height={200}
            className="object-contain animate-bounce-gentle"
            priority
          />
        </div>

        {/* Chat Bubble with Loading Dots */}
        <div
          ref={bubbleRef}
          className="relative bg-white border-3 border-[#473025] rounded-2xl px-8 py-6 shadow-xl"
        >
          {/* Chat bubble tail */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-l-3 border-t-3 border-[#473025] rotate-45"></div>

          <div className="flex flex-col items-center gap-3">
            <p className="font-quicksand font-bold text-[#473025] text-lg text-center">
              {message}
            </p>

            {/* Three Dot Animation */}
            <div className="flex items-center gap-2">
              <div
                ref={dot1Ref}
                className="w-3 h-3 bg-[#96b902] rounded-full"
              />
              <div
                ref={dot2Ref}
                className="w-3 h-3 bg-[#96b902] rounded-full"
              />
              <div
                ref={dot3Ref}
                className="w-3 h-3 bg-[#96b902] rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
