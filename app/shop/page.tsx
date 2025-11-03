'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ShopPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-[#96b902] opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-[#fd9227] opacity-10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-[#ff9f22] opacity-10 rounded-full blur-xl"></div>

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => router.back()}
          className="bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[11px] h-[45px] px-6 flex items-center gap-2 hover:bg-[#e6832b] transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-quicksand font-bold text-white text-[16px]">
            Back
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto text-center animate-fade-in relative z-10">
        {/* Dragon Drops logo/title with special styling */}
        <div className="mb-8">
          <h1 className="font-quicksand font-bold text-[#473025] text-[48px] sm:text-[60px] lg:text-[72px] leading-tight mb-2">
            Dragon Drops
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent to-[#96b902] rounded-full"></div>
            <span className="font-quicksand font-bold text-[#a7613c] text-[18px] sm:text-[20px]">
              Gacha Pack Opening
            </span>
            <div className="h-1 w-16 bg-gradient-to-l from-transparent to-[#96b902] rounded-full"></div>
          </div>
        </div>

        {/* Pack illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[420px] lg:h-[420px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Animated pack placeholder */}
              <div className="relative">
                <div className="w-[200px] h-[240px] sm:w-[240px] sm:h-[280px] bg-gradient-to-br from-[#ff9f22] to-[#fd9227] border-4 border-[#730f11] rounded-[20px] shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  {/* Pack shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 rounded-[16px]"></div>

                  {/* Pack content - dragon symbol */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60 20C75 20 85 30 85 45C85 60 75 70 60 70C45 70 35 60 35 45C35 30 45 20 60 20Z" fill="#fffaf2" opacity="0.9"/>
                      <circle cx="52" cy="42" r="4" fill="#473025"/>
                      <circle cx="68" cy="42" r="4" fill="#473025"/>
                      <path d="M50 55C50 55 55 60 60 60C65 60 70 55 70 55" stroke="#473025" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M35 30L42 38M85 30L78 38" stroke="#473025" strokeWidth="3" strokeLinecap="round"/>

                      {/* Sparkles */}
                      <circle cx="30" cy="40" r="3" fill="#96b902"/>
                      <circle cx="90" cy="50" r="2" fill="#96b902"/>
                      <circle cx="25" cy="70" r="2" fill="#ffb554"/>
                      <circle cx="95" cy="35" r="3" fill="#ffb554"/>
                    </svg>
                  </div>

                  {/* Pack label */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="font-quicksand font-bold text-white text-[16px] sm:text-[18px]">
                      DRAGON PACK
                    </span>
                  </div>
                </div>

                {/* Floating sparkles around pack */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#96b902] rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-[#ffb554] rounded-full opacity-60 animate-pulse animation-delay-500"></div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-[#ff9f22] rounded-full opacity-60 animate-pulse animation-delay-1000"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="font-quicksand font-bold text-[#473025] text-[20px] sm:text-[24px] lg:text-[28px] leading-relaxed mb-8 max-w-2xl mx-auto">
          Open magical dragon packs to unlock exclusive items, cosmetics, and power-ups for your games!
        </p>

        {/* Coming Soon badge */}
        <div className="inline-block mb-12">
          <div className="bg-gradient-to-r from-[#96b902] to-[#7a9700] border-[3px] border-[#006029] rounded-[15px] px-8 py-4 shadow-lg">
            <span className="font-quicksand font-bold text-white text-[24px] sm:text-[28px] lg:text-[32px]">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {/* Cosmetics */}
          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ff9f22] to-[#fd9227] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              Cosmetics
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Unique skins and themes for your wyrm
            </p>
          </div>

          {/* Power-ups */}
          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-[#96b902] to-[#7a9700] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              Power-ups
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Boost your gameplay with special abilities
            </p>
          </div>

          {/* Rare Items */}
          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ffb554] to-[#ff9f22] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              Rare Items
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Collect legendary and mythic treasures
            </p>
          </div>

          {/* Badges */}
          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-[#fd9227] to-[#e6832b] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="6" stroke="white" strokeWidth="2"/>
                <path d="M12 14L8 22L12 20L16 22L12 14Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              Badges
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Earn and display achievement badges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
