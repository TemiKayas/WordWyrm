'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function OceanWave() {
  const wave1Ref = useRef<SVGPathElement>(null);
  const wave2Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate waves
      gsap.to(wave1Ref.current, {
        attr: { d: 'M0 25 Q 50 15, 100 25 T 200 25 T 300 25 T 400 25 T 500 25 T 600 25 T 700 25 T 800 25 T 900 25 T 1000 25 T 1100 25 T 1200 25 T 1300 25 T 1400 25 T 1500 25 V 60 H 0 Z' },
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      gsap.to(wave2Ref.current, {
        attr: { d: 'M0 35 Q 75 30, 150 35 T 300 35 T 450 35 T 600 35 T 750 35 T 900 35 T 1050 35 T 1200 35 T 1350 35 T 1500 35 V 60 H 0 Z' },
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full h-[60px] overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#5fa8d3]">
      <svg
        className="absolute bottom-0 left-0 w-full h-full"
        viewBox="0 0 1500 60"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Wave 1 - Lighter blue */}
        <path
          ref={wave1Ref}
          d="M0 25 Q 75 20, 150 25 T 300 25 T 450 25 T 600 25 T 750 25 T 900 25 T 1050 25 T 1200 25 T 1350 25 T 1500 25 V 60 H 0 Z"
          fill="#5fa8d3"
          opacity="0.8"
        />

        {/* Wave 2 - Darker blue */}
        <path
          ref={wave2Ref}
          d="M0 35 Q 100 33, 200 35 T 400 35 T 600 35 T 800 35 T 1000 35 T 1200 35 T 1400 35 T 1600 35 V 60 H 0 Z"
          fill="#4A90A4"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
