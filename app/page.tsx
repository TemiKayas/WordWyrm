'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf2] overflow-x-hidden">
      {/* hero section */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative">
        {/* wordwyrm logo */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <Image
            src="/assets/WordWyrm.svg"
            alt="WordWyrm"
            width={300}
            height={60}
            className="object-contain w-[200px] sm:w-[250px] md:w-[300px] h-auto"
          />
        </div>

        {/* main content */}
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-20 max-w-6xl mx-auto animate-fade-in animation-delay-200">
          {/* left side - gif */}
          <div className="flex-shrink-0 w-[280px] h-[263px] sm:w-[340px] sm:h-[319px] lg:w-[380px] lg:h-[357px] relative">
            <img
              src="/assets/main.gif"
              alt="WordWyrm mascot"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* right side - content */}
          <div className="flex flex-col items-start gap-6 sm:gap-8 max-w-xl w-full">
            <h2 className="font-quicksand font-bold text-[#473025] text-[28px] sm:text-[36px] lg:text-[48px] leading-tight text-center lg:text-left w-full">
              Scales, tales, and everything in between.
            </h2>

            <div className="flex flex-col gap-5 sm:gap-[30px] w-full max-w-[413px] mx-auto lg:mx-0">
              <Link href="/login" className="w-full">
                <Button variant="secondary" size="lg" className="w-full border-[5px] text-base sm:text-lg">
                  Log in or Sign up
                </Button>
              </Link>

              <Link href="/join" className="w-full">
                <Button variant="primary" size="lg" className="w-full border-[5px] text-base sm:text-lg">
                  I have a Game Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* scroll down arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <Image
            src="/assets/landing/arrow-down.svg"
            alt="Scroll down"
            width={16}
            height={12}
            className="opacity-60 rotate-180"
          />
        </div>
      </div>

      {/* feature section 1 - Smart Quiz Creation */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            {/* left side - text */}
            <div
              className={`flex flex-col gap-4 sm:gap-6 max-w-xl transition-all duration-1000 ${
                scrollY > 300 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
              className={`flex-shrink-0 transition-all duration-1000 delay-300 ${
                scrollY > 300 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <Image
                src="/assets/landing/dragon-flying.png"
                alt="Flying dragon creating quizzes"
                width={326}
                height={326}
                className="object-contain w-[220px] sm:w-[280px] lg:w-[326px] h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* feature section 2 - Game-Based Learning */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 bg-[#fff5e8]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            {/* right side - text */}
            <div
              className={`flex flex-col gap-4 sm:gap-6 max-w-xl transition-all duration-1000 ${
                scrollY > 1000 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
              className={`flex-shrink-0 transition-all duration-1000 delay-300 ${
                scrollY > 1000 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              <Image
                src="/assets/landing/dragon-teaching.png"
                alt="Dragon teaching through games"
                width={312}
                height={312}
                className="object-contain w-[210px] sm:w-[270px] lg:w-[312px] h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* feature section 3 - Track Progress */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-12">
            {/* left side - text */}
            <div
              className={`flex flex-col gap-4 sm:gap-6 max-w-xl transition-all duration-1000 ${
                scrollY > 1800 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
              className={`flex-shrink-0 transition-all duration-1000 delay-300 ${
                scrollY > 1800 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <Image
                src="/assets/landing/dragon-reading.png"
                alt="Dragon reading and tracking progress"
                width={285}
                height={285}
                className="object-contain w-[195px] sm:w-[250px] lg:w-[285px] h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* footer CTA */}
      <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-[#473025]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-quicksand font-bold text-white text-[28px] sm:text-[36px] lg:text-[42px] mb-6 sm:mb-8 px-2">
            Ready to transform your classroom?
          </h3>
          <Link href="/signup">
            <Button variant="success" className="text-[20px] sm:text-[24px] lg:text-[28px] px-8 sm:px-10 lg:px-12 py-3 sm:py-4 h-auto">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
