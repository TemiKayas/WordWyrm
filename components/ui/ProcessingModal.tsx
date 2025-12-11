'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

interface ProcessingModalProps {
  isOpen: boolean;
  message?: string;
  contentType?: 'pdf' | 'text' | 'both';
}

export default function ProcessingModal({
  isOpen,
  message,
  contentType = 'pdf'
}: ProcessingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const dot1Ref = useRef<HTMLDivElement>(null);
  const dot2Ref = useRef<HTMLDivElement>(null);
  const dot3Ref = useRef<HTMLDivElement>(null);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Define message sequences based on content type
  const getMessages = () => {
    const firstMessage = contentType === 'text'
      ? "Processing your words..."
      : contentType === 'both'
      ? "Uploading your content..."
      : "Uploading your PDF";

    return [
      { text: firstMessage, duration: 6000 },
      { text: "Processing the material", duration: 7000 },
      { text: "Oh no Floopa is eating it..", duration: 5000 },
      { text: "Generating Questions", duration: 8000 },
      { text: "Finishing up", duration: Infinity } // Stay on this message
    ];
  };

  const messages = getMessages();

  // Cycle through messages
  useEffect(() => {
    if (!isOpen) {
      setCurrentMessageIndex(0);
      return;
    }

    // If we're at the last message, don't set a timer
    if (currentMessageIndex >= messages.length - 1) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentMessageIndex(prev => Math.min(prev + 1, messages.length - 1));
    }, messages[currentMessageIndex].duration);

    return () => clearTimeout(timer);
  }, [isOpen, currentMessageIndex, messages]);

  // Animate message changes
  useEffect(() => {
    if (!isOpen || !messageRef.current) return;

    gsap.fromTo(messageRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
  }, [currentMessageIndex, isOpen]);

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

  // Use custom message if provided, otherwise use cycling messages
  const displayMessage = message || messages[currentMessageIndex].text;

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
            <p
              ref={messageRef}
              className="font-quicksand font-bold text-[#473025] text-lg text-center min-h-[28px]"
            >
              {displayMessage}
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
