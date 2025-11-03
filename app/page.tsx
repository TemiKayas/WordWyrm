'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainGifRef = useRef<HTMLImageElement>(null);
  const [gifKey, setGifKey] = useState(0);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setVisibleSections((prev) => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(index);
              }
              return newSet;
            });
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  // Prevent scrolling past boundaries
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      // Prevent negative scroll
      if (scrollTop < 0) {
        window.scrollTo(0, 0);
      }

      // Prevent scroll beyond footer
      if (scrollTop > maxScroll) {
        window.scrollTo(0, maxScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force GIF to loop by reloading it periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGifKey(prev => prev + 1);
    }, 2500); // Reload GIF every 10 seconds to ensure it loops

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf2] overflow-x-hidden">
      {/* hero section */}
      <div
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative bg-[#fffaf2]"
      >
        {/* wordwyrm logo */}
        <div className="mb-6 sm:mb-8 opacity-0 animate-[fadeInScale_0.4s_ease-out_forwards]">
          <Image
            src="/assets/WordWyrm.svg"
            alt="WordWyrm"
            width={300}
            height={60}
            className="object-contain w-[200px] sm:w-[250px] md:w-[300px] h-auto"
          />
        </div>

        {/* main content */}
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-20 max-w-6xl mx-auto opacity-0 animate-[fadeInScale_0.6s_ease-out_0.2s_forwards]">
          {/* left side - gif */}
          <div className="flex-shrink-0 w-[280px] h-[263px] sm:w-[340px] sm:h-[319px] lg:w-[380px] lg:h-[357px] relative transform transition-transform duration-700">
            <img
              key={`main-gif-${gifKey}`}
              ref={mainGifRef}
              src={`/assets/main.gif?v=${gifKey}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* right side - content */}
          <div className="flex flex-col items-start gap-6 sm:gap-8 max-w-xl w-full">
            <h2 className="font-quicksand font-bold text-[#473025] text-[28px] sm:text-[36px] lg:text-[48px] leading-tight text-center lg:text-left w-full">
              Scales, tales, and everything in between.
            </h2>

            <div className="flex flex-col gap-5 sm:gap-[30px] w-full max-w-[413px] mx-auto lg:mx-0">
              <Link href="/login" className="w-full opacity-0 animate-[fadeInScale_0.8s_ease-out_0.5s_forwards]">
                <Button variant="secondary" size="lg" className="w-full border-[5px] text-base sm:text-lg transform transition-all duration-200 hover:scale-[1.05] hover:-rotate-1 hover:shadow-2xl active:scale-95">
                  Log in or Sign up
                </Button>
              </Link>

              <Link href="/join" className="w-full opacity-0 animate-[fadeInScale_0.8s_ease-out_0.7s_forwards]">
                <Button variant="primary" size="lg" className="w-full border-[5px] text-base sm:text-lg transform transition-all duration-200 hover:scale-[1.05] hover:rotate-1 hover:shadow-2xl active:scale-95">
                  I have a Game Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* scroll down arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-[bounce_2s_ease-in-out_infinite] hidden sm:block opacity-0">
          <Image
            src="/assets/landing/arrow-down.svg"
            alt="Scroll down"
            width={20}
            height={16}
            className="opacity-60 rotate-180"
          />
        </div>
      </div>

      {/* feature section 1 - Smart Quiz Creation */}
      <div
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 bg-[#fffaf2]"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            {/* left side - text */}
            <div
              className={`flex flex-col gap-4 sm:gap-6 max-w-xl transition-all duration-[1.2s] ease-out ${
                visibleSections.has(1)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-16'
              }`}
            >
              <h3 className="font-quicksand font-bold text-[#473025] text-[32px] sm:text-[36px] lg:text-[42px] leading-tight text-center lg:text-left">
                From PDFs
                <br />
                to Quizzes
              </h3>
              <p className="font-quicksand font-bold text-[#473025] text-[18px] sm:text-[20px] lg:text-[24px] leading-relaxed text-center lg:text-left">
                Upload your materials and let WordWyrm fly! Our AI instantly transforms any PDF into engaging quizzes that make learning fun.
              </p>
            </div>

            {/* right side - dragon image */}
            <div
              className={`flex-shrink-0 transition-all duration-[1.2s] ease-out delay-200 ${
                visibleSections.has(1)
                  ? 'opacity-100 translate-x-0 rotate-0'
                  : 'opacity-0 translate-x-20 rotate-12'
              }`}
            >
              <Image
                src="/assets/landing/dragon-flying.png"
                alt="Flying dragon creating quizzes"
                width={326}
                height={326}
                className="object-contain w-[220px] sm:w-[280px] lg:w-[326px] h-auto transform transition-transform duration-500 hover:scale-110 hover:-rotate-6"
              />
            </div>
          </div>
        </div>
      </div>

      {/* feature section 2 - Game-Based Learning */}
      <div
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 bg-[#fff5e8]"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            {/* right side - text */}
            <div
              className={`flex flex-col gap-4 sm:gap-6 max-w-xl transition-all duration-[1.2s] ease-out ${
                visibleSections.has(2)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-16'
              }`}
            >
              <h3 className="font-quicksand font-bold text-[#473025] text-[32px] sm:text-[36px] lg:text-[42px] leading-tight text-center lg:text-right">
                Learn Through
                <br />
                Play
              </h3>
              <p className="font-quicksand font-bold text-[#473025] text-[18px] sm:text-[20px] lg:text-[24px] leading-relaxed text-center lg:text-right">
                Time to level up! Students play exciting games while answering questions. Learning becomes an adventure, not a chore.
              </p>
            </div>

            {/* left side - dragon image */}
            <div
              className={`flex-shrink-0 transition-all duration-[1.2s] ease-out delay-200 ${
                visibleSections.has(2)
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 -translate-x-20 scale-75'
              }`}
            >
              <Image
                src="/assets/landing/dragon-teaching.png"
                alt="Dragon teaching through games"
                width={312}
                height={312}
                className="object-contain w-[210px] sm:w-[270px] lg:w-[312px] h-auto transform transition-transform duration-500 hover:scale-110 hover:rotate-6"
              />
            </div>
          </div>
        </div>
      </div>

      {/* feature section 3 - Track Progress */}
      <div
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 bg-[#fffaf2]"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            {/* left side - text */}
            <div
              className={`flex flex-col gap-4 sm:gap-6 max-w-xl transition-all duration-[1.2s] ease-out ${
                visibleSections.has(3)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-16'
              }`}
            >
              <h3 className="font-quicksand font-bold text-[#473025] text-[32px] sm:text-[36px] lg:text-[42px] leading-tight text-center lg:text-left">
                Watch Them
                <br />
                Grow
              </h3>
              <p className="font-quicksand font-bold text-[#473025] text-[18px] sm:text-[20px] lg:text-[24px] leading-relaxed text-center lg:text-left">
                Study up on student progress! See who&apos;s soaring and who needs support. Real-time insights make teaching easier and smarter.
              </p>
            </div>

            {/* right side - dragon image */}
            <div
              className={`flex-shrink-0 transition-all duration-[1.2s] ease-out delay-200 ${
                visibleSections.has(3)
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 translate-x-20 scale-90'
              }`}
            >
              <Image
                src="/assets/landing/dragon-reading.png"
                alt="Dragon reading and tracking progress"
                width={285}
                height={285}
                className="object-contain w-[195px] sm:w-[250px] lg:w-[285px] h-auto transform transition-transform duration-500 hover:scale-110 hover:-rotate-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* footer CTA */}
      <div
        ref={(el) => { sectionRefs.current[4] = el; }}
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-[#473025]"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h3
            className={`font-quicksand font-bold text-white text-[28px] sm:text-[36px] lg:text-[42px] mb-6 sm:mb-8 px-2 transition-all duration-[1s] ease-out ${
              visibleSections.has(4)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            Ready to transform your classroom?
          </h3>
          <Link href="/signup">
            <Button
              variant="success"
              className={`text-[20px] sm:text-[24px] lg:text-[28px] px-8 sm:px-10 lg:px-12 py-3 sm:py-4 h-auto transform transition-all duration-[.7s] hover:scale-102 ${
                visibleSections.has(4)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
