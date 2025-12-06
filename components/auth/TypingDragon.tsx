'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TypingDragonProps {
  isTyping: boolean;
}

const upSvgs = ['/assets/login/dragon-looking-up-1.svg', '/assets/login/dragon-looking-up-2.svg'];
const downSvgs = ['/assets/login/dragon-looking-down-1.svg', '/assets/login/dragon-looking-down-2.svg'];

export default function TypingDragon({ isTyping }: TypingDragonProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % 2);
    }, 300); // Changed from 500 to 300 for a faster animation

    return () => clearInterval(interval);
  }, []);

  const svgs = isTyping ? upSvgs : downSvgs;

  return (
    <Image
      src={svgs[frame]}
      alt="Animated character"
      width={320}
      height={320}
      className="object-contain mx-auto mb-6"
      unoptimized
    />
  );
}
