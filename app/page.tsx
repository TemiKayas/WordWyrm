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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
        {/* wordwyrm logo */}
        <div className="mb-8 animate-fade-in">
          <Image
            src="/assets/WordWyrm.svg"
            alt="WordWyrm"
            width={300}
            height={60}
            className="object-contain"
          />
        </div>

        {/* main content */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20 max-w-6xl mx-auto animate-fade-in animation-delay-200">
          {/* left side - gif */}
          <div className="flex-shrink-0 w-[380px] h-[357px] relative">
            <img
              src="/assets/main.gif"
              alt="WordWyrm mascot"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* right side - content */}
          <div className="flex flex-col items-start gap-8 max-w-xl">
            <h2 className="font-quicksand font-bold text-[#473025] text-[36px] lg:text-[48px] leading-tight">
              Scales, tales, and everything in between.
            </h2>

            <div className="flex flex-col gap-[30px] w-full max-w-[413px]">
              <Link href="/login" className="w-full">
                <Button variant="secondary" size="lg" className="w-full border-[5px]">
                  Log in or Sign up
                </Button>
              </Link>

              <Link href="/login" className="w-full">
                <Button variant="primary" size="lg" className="w-full border-[5px]">
                  I have a Game Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* scroll down arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
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
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* left side - text */}
            <div
              className={`flex flex-col gap-6 max-w-xl transition-all duration-1000 ${
                scrollY > 300 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="font-quicksand font-bold text-[#473025] text-[42px] leading-tight">
                From PDFs
                <br />
                to Quizzes
              </h3>
              <p className="font-quicksand font-bold text-[#473025] text-[24px] leading-relaxed">
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
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* feature section 2 - Game-Based Learning */}
      <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-[#fff5e8]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12">
            {/* right side - text */}
            <div
              className={`flex flex-col gap-6 max-w-xl transition-all duration-1000 ${
                scrollY > 1000 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="font-quicksand font-bold text-[#473025] text-[42px] leading-tight lg:text-right">
                Learn Through
                <br />
                Play
              </h3>
              <p className="font-quicksand font-bold text-[#473025] text-[24px] leading-relaxed lg:text-right">
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
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* feature section 3 - Track Progress */}
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* left side - text */}
            <div
              className={`flex flex-col gap-6 max-w-xl transition-all duration-1000 ${
                scrollY > 1800 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h3 className="font-quicksand font-bold text-[#473025] text-[42px] leading-tight">
                Watch Them
                <br />
                Grow
              </h3>
              <p className="font-quicksand font-bold text-[#473025] text-[24px] leading-relaxed">
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
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* footer CTA */}
      <div className="py-20 px-4 bg-[#473025]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-quicksand font-bold text-white text-[42px] mb-8">
            Ready to transform your classroom?
          </h3>
          <Link href="/signup">
            <Button variant="success" className="text-[28px] px-12 py-4 h-auto">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
