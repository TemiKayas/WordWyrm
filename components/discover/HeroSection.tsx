'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-visible">
      {/* Enhanced blue ocean background gradient with more vibrant blues */}
      <div className="absolute inset-0 h-full bg-gradient-to-b from-[#4A90E2] via-[#67B8E3] to-[#87CEEB] overflow-hidden">
        {/* Additional gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2E5F8E]/30 via-transparent to-[#5FA8D3]/20"></div>
      </div>

      {/* Top Wave Layer (Behind) - Sifts opposite direction */}
      <div className="absolute bottom-0 left-0 w-[140%] h-[120px] sm:h-[140px] md:h-[160px] pointer-events-none z-10 -ml-[20%]">
        <Image
          src="/assets/discover/top-wave.svg"
          alt=""
          width={1728}
          height={160}
          className="w-full h-full object-cover object-bottom animate-wave-sift-top opacity-80"
          priority
        />
      </div>

      {/* Bottom Wave Layer (Front) - Sifts left to right slowly */}
      <div className="absolute bottom-0 left-0 w-[140%] h-[120px] sm:h-[140px] md:h-[160px] pointer-events-none z-20 -ml-[20%]">
        <Image
          src="/assets/discover/bottom-wave.svg"
          alt=""
          width={1728}
          height={160}
          className="w-full h-full object-cover object-bottom animate-wave-sift-bottom"
          priority
        />
      </div>

      {/* Discover Floopa Character - positioned to overflow above the section */}
      <div className="absolute -bottom-[20px] sm:-bottom-[30px] md:-bottom-[40px] right-[5%] sm:right-[8%] w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[220px] md:h-[220px] pointer-events-none z-40 drop-shadow-2xl">
        <Image
          src="/assets/discover/discover-floopa.svg"
          alt="Discover Floopa"
          width={220}
          height={220}
          className="w-full h-auto animate-character-sway"
          priority
        />
      </div>

      {/* Optional: Add some subtle water shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-pulse pointer-events-none z-5 opacity-40"></div>
    </div>
  );
}
