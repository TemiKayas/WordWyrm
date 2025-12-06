'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP refs
  const logoRef = useRef<HTMLDivElement>(null);
  const dragonItemsRef = useRef<HTMLDivElement>(null);
  const dragonHeadRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const button1Ref = useRef<HTMLAnchorElement>(null);
  const button2Ref = useRef<HTMLAnchorElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  // Mockup refs for cursor-following
  const mockup1Ref = useRef<HTMLDivElement>(null);
  const mockup2Ref = useRef<HTMLDivElement>(null);
  const mockup3Ref = useRef<HTMLDivElement>(null);

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

      if (scrollTop < 0) {
        window.scrollTo(0, 0);
      }

      if (scrollTop > maxScroll) {
        window.scrollTo(0, maxScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero section animations
      gsap.from(logoRef.current, {
        y: -100,
        opacity: 0,
        scale: 0.5,
        rotation: -10,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
      });

      // Dragon with items spins in and STOPS
      gsap.fromTo(dragonItemsRef.current,
        {
          scale: 0.3,
          rotation: -180,
          opacity: 0
        },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'back.out(1.7)',
          delay: 0.3,
        }
      );

      // Dragon head flies in from left and STOPS
      gsap.fromTo(dragonHeadRef.current,
        {
          x: -200,
          opacity: 0,
          scale: 0.8
        },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.9,
        }
      );

      gsap.from(headlineRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: 'back.out(2)',
        delay: 1.2,
      });

      // Button animations with bounce
      gsap.from(button1Ref.current, {
        y: 50,
        opacity: 0,
        scale: 0.8,
        rotation: -5,
        duration: 1,
        ease: 'back.out(2)',
        delay: 1.4,
      });

      gsap.from(button2Ref.current, {
        y: 50,
        opacity: 0,
        scale: 0.8,
        rotation: 5,
        duration: 1,
        ease: 'back.out(2)',
        delay: 1.6,
      });

      // Scroll indicator bounce
      gsap.to(scrollIndicatorRef.current, {
        y: 15,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

      // ScrollTrigger animations for feature sections
      sectionRefs.current.forEach((section, index) => {
        if (index === 0 || !section) return;

        const images = section.querySelectorAll('img');
        const texts = section.querySelectorAll('h3, p');
        const mockups = section.querySelectorAll('.mockup-browser');

        gsap.from(texts, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 20%',
            toggleActions: 'play none none reverse',
          },
          y: 80,
          opacity: 0,
          duration: 1.2,
          stagger: 0.15,
          ease: 'power3.out',
        });

        gsap.from(images, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 20%',
            toggleActions: 'play none none reverse',
          },
          scale: 0.5,
          rotation: index % 2 === 0 ? 25 : -25,
          opacity: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.6)',
        });

        // Animate mockups on scroll
        gsap.from(mockups, {
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 20%',
            toggleActions: 'play none none reverse',
          },
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
        });
      });
    });

    return () => ctx.revert();
  }, []);

  // Mouse move handler for mockup 3D tilt (cursor following)
  const handleMockupMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt based on mouse position
    const rotateY = ((x - centerX) / centerX) * 20;
    const rotateX = ((centerY - y) / centerY) * 15;

    gsap.to(ref.current, {
      rotateX: rotateX,
      rotateY: rotateY,
      scale: 1.08,
      duration: 0.15,
      ease: 'power1.out',
      transformPerspective: 800,
    });
  };

  const handleMockupMouseLeave = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
    });
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] overflow-x-hidden">
      {/* hero section */}
      <div
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative bg-[#fffaf2]"
      >
        {/* wordwyrm logo */}
        <div ref={logoRef} className="mb-6 sm:mb-8">
          <Image
            src="/assets/LearnWyrm.svg"
            alt="WordWyrm"
            width={300}
            height={60}
            className="object-contain w-[200px] sm:w-[250px] md:w-[300px] h-auto"
          />
        </div>

        {/* main content */}
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-20 max-w-6xl mx-auto">
          {/* left side - layered dragon images - BIGGER */}
          <div className="flex-shrink-0 w-[350px] h-[329px] sm:w-[450px] sm:h-[423px] lg:w-[550px] lg:h-[517px] relative">
            {/* Dragon with items (spins in first) */}
            <div
              ref={dragonItemsRef}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Image
                src="/assets/landing/hero-dragon-with-items.png"
                alt="Floopa with educational items"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

            {/* Dragon head (comes in second, layered on top) */}
            <div
              ref={dragonHeadRef}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Image
                src="/assets/landing/hero-dragon-head.png"
                alt="Floopa's head"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* right side - content */}
          <div ref={contentRef} className="flex flex-col items-start gap-6 sm:gap-8 max-w-xl w-full">
            <h2 ref={headlineRef} className="font-quicksand font-bold text-[#473025] text-[28px] sm:text-[36px] lg:text-[52px] leading-tight text-center lg:text-left w-full">
                Take Your Lessons from “Have to” to “Want to!”
            </h2>

            <p className="font-quicksand font-bold text-[#6b4e3d] text-[16px] sm:text-[18px] lg:text-[20px] leading-relaxed text-center lg:text-left w-full">
              Turn PDFs into playful quizzes. Share instantly. Make learning fun.
            </p>

            <div className="flex flex-col gap-5 sm:gap-[30px] w-full max-w-[413px] mx-auto lg:mx-0">
              <Link ref={button1Ref} href="/login" className="w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full border-[5px] text-base sm:text-lg"
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, rotation: -1, duration: 0.15 })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, rotation: 0, duration: 0.15 })}
                >
                  Log in or Sign up
                </Button>
              </Link>

              <Link ref={button2Ref} href="/join" className="w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full border-[5px] text-base sm:text-lg"
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, rotation: 1, duration: 0.15 })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, rotation: 0, duration: 0.15 })}
                >
                  I have a Game Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* scroll down indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <div className="flex flex-col items-center gap-1">
            <p className="font-quicksand font-bold text-[#473025] text-[11px] uppercase tracking-wide">
              Scroll
            </p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5v14m0 0l-7-7m7 7l7-7" stroke="#473025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* feature section 1 - Smart Quiz Creation */}
      <div
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 bg-[#fffaf2]"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-16">
            {/* left side - text and mockup */}
            <div className="flex flex-col gap-6 max-w-lg flex-1">
              <div
                className={`flex flex-col gap-4 sm:gap-6 transition-all duration-[1.2s] ease-out ${
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

              {/* Browser Mockup with cursor follow */}
              <div
                ref={mockup1Ref}
                className="mockup-browser bg-base-300 border border-[#473025]/30 shadow-xl cursor-pointer hidden lg:block"
                style={{ transformStyle: 'preserve-3d' }}
                onMouseMove={(e) => handleMockupMouseMove(e, mockup1Ref)}
                onMouseLeave={() => handleMockupMouseLeave(mockup1Ref)}
              >
                <div className="mockup-browser-toolbar">
                  <div className="input border-[#473025]/30 text-[#473025]/70 text-sm">learnwyrm.com/upload</div>
                </div>
                <div className="bg-[#fffaf2] flex justify-center px-4 py-4">
                  <Image
                    src="/assets/landing/pdf-upload-interface.png"
                    alt="PDF upload interface"
                    width={500}
                    height={300}
                    className="object-contain w-full h-auto rounded"
                  />
                </div>
              </div>
            </div>

            {/* right side - asset image (smaller) */}
            <div className="flex-shrink-0">
              <Image
                src="/assets/landing/quiz-game-mockup.png"
                alt="Quiz game mockup"
                width={350}
                height={350}
                className="object-contain w-[200px] sm:w-[250px] lg:w-[350px] h-auto drop-shadow-2xl"
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
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-8 sm:gap-10 lg:gap-8">
            {/* right side - text and mockup */}
            <div className="flex flex-col gap-6 max-w-lg flex-1 lg:items-end">
              <div
                className={`flex flex-col gap-4 sm:gap-6 transition-all duration-[1.2s] ease-out ${
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

              {/* Browser Mockup with cursor follow */}
              <div
                ref={mockup2Ref}
                className="mockup-browser bg-base-300 border border-[#473025]/30 shadow-xl cursor-pointer hidden lg:block w-full"
                style={{ transformStyle: 'preserve-3d' }}
                onMouseMove={(e) => handleMockupMouseMove(e, mockup2Ref)}
                onMouseLeave={() => handleMockupMouseLeave(mockup2Ref)}
              >
                <div className="mockup-browser-toolbar">
                  <div className="input border-[#473025]/30 text-[#473025]/70 text-sm">learnwyrm.com/play</div>
                </div>
                <div className="bg-[#96b902] flex justify-center px-4 py-4">
                  <Image
                    src="/assets/landing/td-game-preview.png"
                    alt="Tower defense game"
                    width={700}
                    height={400}
                    className="object-contain w-full h-auto rounded-[12px]"
                  />
                </div>
              </div>
            </div>

            {/* left side - asset image (bigger) */}
            <div className="flex-shrink-0 relative">
              <Image
                src="/assets/landing/floopa-correct-answer.png"
                alt="Floopa celebrating"
                width={700}
                height={700}
                className="object-contain w-[280px] sm:w-[400px] lg:w-[550px] h-auto drop-shadow-2xl"
              />
              {/* Wrong answer Floopa (bigger) */}
              <div className="absolute -bottom-8 -left-8 w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] lg:w-[250px] lg:h-[250px] opacity-80">
                <Image
                  src="/assets/landing/floopa-wrong-answer.png"
                  alt="Floopa sad"
                  fill
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* feature section 3 - Track Progress */}
      <div
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 bg-[#fffaf2]"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 lg:gap-16">
            {/* left side - text and mockup */}
            <div className="flex flex-col gap-6 max-w-lg flex-1">
              <div
                className={`flex flex-col gap-4 sm:gap-6 transition-all duration-[1.2s] ease-out ${
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

              {/* Browser Mockup with cursor follow */}
              <div
                ref={mockup3Ref}
                className="mockup-browser bg-base-300 border border-[#473025]/30 shadow-xl cursor-pointer hidden lg:block"
                style={{ transformStyle: 'preserve-3d' }}
                onMouseMove={(e) => handleMockupMouseMove(e, mockup3Ref)}
                onMouseLeave={() => handleMockupMouseLeave(mockup3Ref)}
              >
                <div className="mockup-browser-toolbar">
                  <div className="input border-[#473025]/30 text-[#473025]/70 text-sm">learnwyrm.com/analytics</div>
                </div>
                <div className="bg-[#fffaf2] flex justify-center px-4 py-4">
                  <Image
                    src="/assets/landing/analytics-dashboard-preview.png"
                    alt="Analytics dashboard"
                    width={700}
                    height={450}
                    className="object-contain w-full h-auto rounded"
                  />
                </div>
              </div>
            </div>

            {/* right side - asset image (smaller) */}
            <div className="flex-shrink-0">
              <Image
                src="/assets/landing/analytics-chart-mockup.png"
                alt="Analytics chart"
                width={450}
                height={450}
                className="object-contain w-[250px] sm:w-[350px] lg:w-[450px] h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* footer CTA */}
      <div
        ref={(el) => { sectionRefs.current[4] = el; }}
        className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-[#473025]"
      >
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="font-quicksand font-bold text-[#f5e6d3] text-[20px] sm:text-[24px] lg:text-[28px] mb-10 leading-relaxed">
            Turn your PDFs into engaging quizzes in minutes
          </p>

          <Link href="/signup">
            <Button
              variant="success"
              size="lg"
              className="text-[18px] sm:text-[20px] lg:text-[22px] px-12 sm:px-14 lg:px-16 border-[5px]"
              onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
