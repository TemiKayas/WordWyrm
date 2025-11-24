'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Sample student data for interactive analytics
const sampleStudents = [
  { name: 'Emma S.', score: 95, streak: 7, avatar: '🦊' },
  { name: 'Liam T.', score: 88, streak: 5, avatar: '🐸' },
  { name: 'Olivia M.', score: 72, streak: 3, avatar: '🦋' },
  { name: 'Noah K.', score: 91, streak: 6, avatar: '🐙' },
  { name: 'Ava P.', score: 85, streak: 4, avatar: '🦄' },
  { name: 'Mason R.', score: 78, streak: 2, avatar: '🐲' },
  { name: 'Sophia L.', score: 94, streak: 8, avatar: '🐼' },
];

// Register GSAP plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  // Track if hero entrance animation is complete
  const [heroAnimationComplete, setHeroAnimationComplete] = useState(false);
  // Track hovered student for interactive analytics
  const [hoveredStudent, setHoveredStudent] = useState<number | null>(null);

  // Refs for GSAP animations
  const heroImageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Feature section refs
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);

  // Dragon image refs
  const dragon1Ref = useRef<HTMLDivElement>(null);
  const dragon2Ref = useRef<HTMLDivElement>(null);
  const dragon3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial states to prevent flash of unstyled content
    gsap.set([heroImageRef.current, headlineRef.current, scrollIndicatorRef.current], {
      opacity: 1
    });

    const ctx = gsap.context(() => {
      // Simple hero entrance animation
      const heroTl = gsap.timeline({
        defaults: { ease: 'power2.out' }
      });

      heroTl
        .fromTo(heroImageRef.current,
          { x: -80, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8 }
        )
        .fromTo(headlineRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(buttonsRef.current?.children || [],
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.15, duration: 0.5 },
          '-=0.3'
        )
        .fromTo(scrollIndicatorRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 0.7, duration: 0.4 },
          '-=0.2'
        )
        .call(() => setHeroAnimationComplete(true));

      // Gentle floating animation for hero image
      gsap.to(heroImageRef.current, {
        y: -10,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Scroll indicator bounce
      gsap.to(scrollIndicatorRef.current, {
        y: 8,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Gentle dragon floating animations
      [dragon1Ref, dragon2Ref, dragon3Ref].forEach((ref, i) => {
        if (!ref.current) return;
        gsap.to(ref.current, {
          y: -6,
          duration: 2 + (i * 0.3),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      // ScrollTrigger animations for feature sections
      const sections = [
        { ref: section1Ref, direction: 'left' },
        { ref: section2Ref, direction: 'right' },
        { ref: section3Ref, direction: 'left' },
      ];

      sections.forEach(({ ref, direction }) => {
        if (!ref.current) return;

        const textElements = ref.current.querySelectorAll('.section-text');
        const imageElements = ref.current.querySelectorAll('.section-image');
        const mockupElements = ref.current.querySelectorAll('.mockup-element');

        // Text fade in from side
        gsap.fromTo(textElements,
          {
            x: direction === 'left' ? -40 : 40,
            opacity: 0
          },
          {
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
            x: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power2.out',
          }
        );

        // Image scale in
        gsap.fromTo(imageElements,
          {
            scale: 0.9,
            opacity: 0
          },
          {
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
          }
        );

        // Mockup fade up
        gsap.fromTo(mockupElements,
          {
            y: 30,
            opacity: 0
          },
          {
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  // 3D tilt hover handler for dragon images with cursor following
  const handleDragonHover = (ref: React.RefObject<HTMLDivElement | null>, enter: boolean) => {
    if (!ref.current) return;
    if (enter) {
      gsap.to(ref.current, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      gsap.to(ref.current, {
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 1000,
      });
    }
  };

  // Mouse move handler for dragon 3D tilt (cursor following) - more obvious effect
  const handleDragonMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt based on mouse position - increased for more obvious effect
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

  // Hero image cursor following (only after entrance animation) - more obvious
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroAnimationComplete || !heroImageRef.current) return;

    const rect = heroImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // More noticeable tilt for hero image
    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 12;

    gsap.to(heroImageRef.current, {
      rotateX: rotateX,
      rotateY: rotateY,
      scale: 1.02,
      duration: 0.2,
      ease: 'power1.out',
      transformPerspective: 1000,
    });
  };

  const handleHeroMouseLeave = () => {
    if (!heroImageRef.current) return;
    gsap.to(heroImageRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 1000,
    });
  };


  return (
    <div className="min-h-screen bg-[#fffaf2] overflow-x-hidden">
      {/* Fixed Header with Logo Only */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fffaf2] border-b border-[#473025]/10">
        <div className="flex items-center justify-center py-4 px-4">
          <img
            src="/images/learnwyrm-logo.svg"
            alt="LearnWyrm"
            className="h-[36px] sm:h-[48px] lg:h-[56px] w-auto"
          />
        </div>
      </header>

      {/* Hero Section */}
      <div className="min-h-screen flex flex-col relative px-4 sm:px-6 lg:px-8 pt-24">
        {/* Main Hero Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-7xl mx-auto w-full py-8">
          {/* Left - Hero Dragon Image */}
          <div
            ref={heroImageRef}
            className="flex-shrink-0 w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[520px] lg:h-[520px] relative cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            <Image
              src="/images/floopa-hero-books.png"
              alt="Floopa flying with educational books"
              fill
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>

          {/* Right - Content */}
          <div className="flex flex-col items-center lg:items-start gap-6 max-w-xl">
            <h2
              ref={headlineRef}
              className="font-quicksand font-bold text-[#473025] text-[28px] sm:text-[36px] lg:text-[40px] leading-tight text-center lg:text-left"
            >
              Take Your Lessons from &ldquo;Have to&rdquo; to &ldquo;Want to!&rdquo;
            </h2>

            <div ref={buttonsRef} className="flex flex-col gap-4 w-full max-w-[409px]">
              <Link href="/login" className="w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                >
                  Log in or Sign up
                </Button>
              </Link>

              <Link href="/join" className="w-full">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  I have a Game Code
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer hover:opacity-100 transition-opacity flex flex-col items-center gap-2"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="font-quicksand text-[#473025] text-xs font-bold uppercase tracking-widest">
            Scroll
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Feature Section 1 - From PDFs to Quizzes */}
      <div
        ref={section1Ref}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#fffaf2]"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Text Content */}
            <div className="flex flex-col gap-6 max-w-lg">
              <h3 className="section-text font-quicksand font-bold text-[#473025] text-[32px] sm:text-[40px] lg:text-[43px] leading-tight">
                From PDFs<br />to Quizzes
              </h3>
              <p className="section-text font-quicksand font-bold text-[#473025] text-[18px] sm:text-[22px] lg:text-[24px] leading-relaxed">
                Upload your materials and let WordWyrm fly! Our AI instantly transforms any PDF into engaging quizzes that make learning fun.
              </p>

              {/* Browser Mockup */}
              <div className="mockup-element mockup-browser bg-base-300 border border-[#473025]/30 mt-4 hidden lg:block shadow-lg">
                <div className="mockup-browser-toolbar">
                  <div className="input border-[#473025]/30 text-[#473025]/70 text-sm">learnwyrm.com/upload</div>
                </div>
                <div className="bg-[#fffaf2] p-6">
                  <Image
                    src="/images/pdf-upload-preview.png"
                    alt="PDF Upload Interface"
                    width={500}
                    height={300}
                    className="object-contain w-full h-auto rounded"
                  />
                </div>
              </div>
            </div>

            {/* Dragon Image */}
            <div
              ref={dragon1Ref}
              className="section-image flex-shrink-0 cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              onMouseEnter={() => handleDragonHover(dragon1Ref, true)}
              onMouseLeave={() => handleDragonHover(dragon1Ref, false)}
              onMouseMove={(e) => handleDragonMouseMove(e, dragon1Ref)}
            >
              <Image
                src="/images/floopa-hungry.png"
                alt="Floopa ready to eat PDFs"
                width={405}
                height={405}
                className="object-contain w-[280px] sm:w-[350px] lg:w-[405px] h-auto drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section 2 - Learn Through Play */}
      <div
        ref={section2Ref}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#fff5e8]"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12">
            {/* Text Content */}
            <div className="flex flex-col gap-6 max-w-lg lg:text-right">
              <h3 className="section-text font-quicksand font-bold text-[#473025] text-[32px] sm:text-[40px] lg:text-[43px] leading-tight">
                Learn<br />Through Play
              </h3>
              <p className="section-text font-quicksand font-bold text-[#473025] text-[18px] sm:text-[22px] lg:text-[24px] leading-relaxed">
                Time to level up! Students play exciting games while answering questions. Learning becomes an adventure, not a chore.
              </p>

              {/* Game Screenshot Mockup */}
              <div className="mockup-element mockup-browser bg-base-300 border border-[#473025]/30 mt-4 hidden lg:block shadow-lg overflow-hidden">
                <div className="mockup-browser-toolbar">
                  <div className="input border-[#473025]/30 text-[#473025]/70 text-sm">learnwyrm.com/play</div>
                </div>
                <div className="bg-[#fffaf2]">
                  <Image
                    src="/images/td-game-preview.png"
                    alt="Tower Defense Game Preview"
                    width={600}
                    height={400}
                    className="object-cover w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Dragon Images */}
            <div className="section-image flex-shrink-0 relative">
              <div
                ref={dragon2Ref}
                className="cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                onMouseEnter={() => handleDragonHover(dragon2Ref, true)}
                onMouseLeave={() => handleDragonHover(dragon2Ref, false)}
                onMouseMove={(e) => handleDragonMouseMove(e, dragon2Ref)}
              >
                <Image
                  src="/images/floopa-correct-answer.png"
                  alt="Floopa celebrating correct answer"
                  width={420}
                  height={420}
                  className="object-contain w-[290px] sm:w-[360px] lg:w-[420px] h-auto drop-shadow-xl"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] opacity-60">
                <Image
                  src="/images/floopa-wrong-answer.png"
                  alt="Floopa wrong answer"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section 3 - Watch Them Grow */}
      <div
        ref={section3Ref}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#fffaf2]"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Text Content */}
            <div className="flex flex-col gap-6 max-w-lg">
              <h3 className="section-text font-quicksand font-bold text-[#473025] text-[32px] sm:text-[40px] lg:text-[43px] leading-tight">
                Watch<br />Them Grow
              </h3>
              <p className="section-text font-quicksand font-bold text-[#473025] text-[18px] sm:text-[22px] lg:text-[24px] leading-relaxed">
                Study up on student progress! See who&apos;s soaring and who needs support. Real-time insights make teaching easier and smarter.
              </p>

              {/* Interactive Analytics Dashboard */}
              <div className="mockup-element mockup-browser bg-base-300 border border-[#473025]/30 mt-4 hidden lg:block shadow-lg">
                <div className="mockup-browser-toolbar">
                  <div className="input border-[#473025]/30 text-[#473025]/70 text-sm">learnwyrm.com/analytics</div>
                </div>
                <div className="bg-[#fffaf2] p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-quicksand font-bold text-[#473025] text-lg">Class Progress</span>
                    <span className="bg-[#96b902] text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                      {Math.round(sampleStudents.reduce((acc, s) => acc + s.score, 0) / sampleStudents.length)}% avg
                    </span>
                  </div>

                  {/* Interactive Bar Chart */}
                  <div className="flex gap-3 items-end h-32 mb-3">
                    {sampleStudents.map((student, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center cursor-pointer group"
                        onMouseEnter={() => setHoveredStudent(i)}
                        onMouseLeave={() => setHoveredStudent(null)}
                      >
                        {/* Tooltip */}
                        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 bg-[#473025] text-white px-3 py-2 rounded-lg text-xs font-quicksand whitespace-nowrap shadow-lg transition-all duration-200 ${hoveredStudent === i ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                          <div className="font-bold">{student.name}</div>
                          <div className="text-[#f5e6d3]">{student.score}% • {student.streak} day streak 🔥</div>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#473025]"></div>
                        </div>

                        {/* Bar */}
                        <div className="relative w-full flex flex-col items-center">
                          <span className="text-lg mb-1">{student.avatar}</span>
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              hoveredStudent === i
                                ? 'bg-[#fd9227] shadow-lg scale-x-110'
                                : student.score >= 90
                                  ? 'bg-[#96b902]'
                                  : student.score >= 80
                                    ? 'bg-[#96b902]/80'
                                    : 'bg-[#fd9227]/70'
                            }`}
                            style={{ height: `${student.score}px` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Student Names */}
                  <div className="flex gap-3">
                    {sampleStudents.map((student, i) => (
                      <div
                        key={i}
                        className={`flex-1 text-center font-quicksand text-[10px] font-bold truncate transition-colors duration-200 ${
                          hoveredStudent === i ? 'text-[#fd9227]' : 'text-[#473025]/60'
                        }`}
                      >
                        {student.name.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dragon Image */}
            <div
              ref={dragon3Ref}
              className="section-image flex-shrink-0 cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
              onMouseEnter={() => handleDragonHover(dragon3Ref, true)}
              onMouseLeave={() => handleDragonHover(dragon3Ref, false)}
              onMouseMove={(e) => handleDragonMouseMove(e, dragon3Ref)}
            >
              <Image
                src="/images/floopa-progress-growth.png"
                alt="Floopa showing student growth"
                width={480}
                height={480}
                className="object-contain w-[320px] sm:w-[400px] lg:w-[480px] h-auto drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-[#473025]">
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="font-quicksand font-bold text-[#f5e6d3] text-[20px] sm:text-[24px] lg:text-[28px] mb-10 leading-relaxed">
            Turn your PDFs into engaging quizzes in minutes
          </p>

          <Link href="/signup">
            <Button
              variant="success"
              size="lg"
              className="text-[18px] sm:text-[20px] lg:text-[22px] px-12 sm:px-14 lg:px-16 border-[5px]"
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
