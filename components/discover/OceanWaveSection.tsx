'use client';

import Image from 'next/image';

export default function OceanWaveSection() {
  return (
    <div className="relative mb-0 h-[160px] overflow-hidden rounded-t-[20px]">
      {/* Blue ocean background gradient */}
      <div className="absolute inset-0 h-[160px] bg-gradient-to-b from-[#87CEEB] via-[#5fa8d3] to-[#fffaf2]"></div>

      {/* Top Wave Layer (Behind) - Sifts opposite direction */}
      <div className="absolute bottom-0 left-0 w-[120%] h-full pointer-events-none z-10">
        <Image
          src="/assets/discover/top-wave.svg"
          alt=""
          width={1728}
          height={160}
          className="w-full h-full object-cover object-bottom animate-wave-sift-top"
        />
      </div>

      {/* Bottom Wave Layer (Front) - Sifts left to right slowly */}
      <div className="absolute bottom-0 left-0 w-[120%] h-full pointer-events-none z-20">
        <Image
          src="/assets/discover/bottom-wave.svg"
          alt=""
          width={1728}
          height={160}
          className="w-full h-full object-cover object-bottom animate-wave-sift-bottom"
        />
      </div>

      {/* Discover Floopa Character on top of waves */}
      <div className="absolute bottom-[10px] right-[8%] w-[200px] h-[200px] pointer-events-none z-30 drop-shadow-lg">
        <Image
          src="/assets/discover/discover-floopa.svg"
          alt="Discover Floopa"
          width={200}
          height={200}
          className="w-full h-auto animate-character-sway"
        />
      </div>
    </div>
  );
}
