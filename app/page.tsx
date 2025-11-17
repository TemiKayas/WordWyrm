'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set([0]));
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainGifRef = useRef<HTMLImageElement>(null);
  const [gifKey, setGifKey] = useState(0);

  // GSAP refs
  const logoRef = useRef<HTMLDivElement>(null);
  const gifContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const button1Ref = useRef<HTMLAnchorElement>(null);
  const button2Ref = useRef<HTMLAnchorElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const dragon1Ref = useRef<HTMLDivElement>(null);
  const dragon2Ref = useRef<HTMLDivElement>(null);
  const dragon3Ref = useRef<HTMLDivElement>(null);

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

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero section animations - more dramatic
      gsap.from(logoRef.current, {
        y: -100,
        opacity: 0,
        scale: 0.5,
        rotation: -10,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
      });

      gsap.from(gifContainerRef.current, {
        x: -200,
        opacity: 0,
        rotation: -20,
        duration: 1.2,
        ease: 'back.out(1.5)',
        delay: 0.3,
      });

      gsap.from(headlineRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: 'back.out(2)',
        delay: 0.6,
      });

      // Button animations with bounce
      gsap.from(button1Ref.current, {
        y: 50,
        opacity: 0,
        scale: 0.8,
        rotation: -5,
        duration: 1,
        ease: 'back.out(2)',
        delay: 0.9,
      });

      gsap.from(button2Ref.current, {
        y: 50,
        opacity: 0,
        scale: 0.8,
        rotation: 5,
        duration: 1,
        ease: 'back.out(2)',
        delay: 1.1,
      });

      // Scroll indicator bounce - more pronounced
      gsap.to(scrollIndicatorRef.current, {
        y: 15,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

      // Floating animation for GIF - gentler
      gsap.to(gifContainerRef.current, {
        y: -12,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Add wiggle to dragons on hover (continuous subtle movement)
      gsap.to(dragon1Ref.current, {
        rotation: 5,
        y: -5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(dragon2Ref.current, {
        rotation: -5,
        y: 5,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(dragon3Ref.current, {
        rotation: 3,
        y: -3,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // ScrollTrigger animations for feature sections - more dramatic
      sectionRefs.current.forEach((section, index) => {
        if (index === 0 || !section) return;

        const images = section.querySelectorAll('img');
        const texts = section.querySelectorAll('h3, p');

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
      });
    });

    return () => ctx.revert();
  }, []);

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
            src="/assets/WordWyrm.svg"
            alt="WordWyrm"
            width={300}
            height={60}
            className="object-contain w-[200px] sm:w-[250px] md:w-[300px] h-auto"
          />
        </div>

        {/* main content */}
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-20 max-w-6xl mx-auto">
          {/* left side - gif */}
          <div ref={gifContainerRef} className="flex-shrink-0 w-[280px] h-[263px] sm:w-[340px] sm:h-[319px] lg:w-[380px] lg:h-[357px] relative">
            <img
              key={`main-gif-${gifKey}`}
              ref={mainGifRef}
              src={`/assets/main.gif?v=${gifKey}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* right side - content */}
          <div ref={contentRef} className="flex flex-col items-start gap-6 sm:gap-8 max-w-xl w-full">
            <h2 ref={headlineRef} className="font-quicksand font-bold text-[#473025] text-[28px] sm:text-[36px] lg:text-[52px] leading-tight text-center lg:text-left w-full">
              Scales, tales, and everything in between.
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
              ref={dragon1Ref}
              className="flex-shrink-0 cursor-pointer transition-all"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1.2,
                  y: -15,
                  rotation: -12,
                  duration: 0.5,
                  ease: 'elastic.out(1, 0.3)',
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1,
                  y: 0,
                  rotation: 0,
                  duration: 0.6,
                  ease: 'elastic.out(1, 0.4)',
                });
              }}
            >
              <Image
                src="/assets/landing/dragon-flying.png"
                alt="Flying dragon creating quizzes"
                width={326}
                height={326}
                className="object-contain w-[220px] sm:w-[280px] lg:w-[326px] h-auto drop-shadow-2xl"
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
              ref={dragon2Ref}
              className="flex-shrink-0 cursor-pointer transition-all"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1.2,
                  x: -10,
                  rotation: 15,
                  duration: 0.5,
                  ease: 'elastic.out(1, 0.3)',
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1,
                  x: 0,
                  rotation: 0,
                  duration: 0.6,
                  ease: 'elastic.out(1, 0.4)',
                });
              }}
            >
              <Image
                src="/assets/landing/dragon-teaching.png"
                alt="Dragon teaching through games"
                width={312}
                height={312}
                className="object-contain w-[210px] sm:w-[270px] lg:w-[312px] h-auto drop-shadow-2xl"
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
              ref={dragon3Ref}
              className="flex-shrink-0 cursor-pointer transition-all"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1.2,
                  y: -10,
                  x: 10,
                  rotation: -10,
                  duration: 0.5,
                  ease: 'elastic.out(1, 0.3)',
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1,
                  y: 0,
                  x: 0,
                  rotation: 0,
                  duration: 0.6,
                  ease: 'elastic.out(1, 0.4)',
                });
              }}
            >
              <Image
                src="/assets/landing/dragon-reading.png"
                alt="Dragon reading and tracking progress"
                width={285}
                height={285}
                className="object-contain w-[195px] sm:w-[250px] lg:w-[285px] h-auto drop-shadow-2xl"
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
