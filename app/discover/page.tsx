'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DiscoverPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative">
      {/* Back button */}
      <div className="absolute top-6 left-6">
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
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        {/* Dragon illustration placeholder */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Placeholder for dragon/wyrm illustration */}
              <div className="w-full h-full rounded-full bg-[#fff6e8] border-4 border-[#473025] flex items-center justify-center">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" fill="#96b902" opacity="0.2"/>
                  <path d="M100 40C127.614 40 150 62.3858 150 90C150 117.614 127.614 140 100 140C72.3858 140 50 117.614 50 90C50 62.3858 72.3858 40 100 40Z" stroke="#473025" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="85" cy="85" r="8" fill="#473025"/>
                  <circle cx="115" cy="85" r="8" fill="#473025"/>
                  <path d="M80 110C80 110 90 120 100 120C110 120 120 110 120 110" stroke="#473025" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M60 60L70 70M140 60L130 70" stroke="#473025" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-quicksand font-bold text-[#473025] text-[42px] sm:text-[52px] lg:text-[64px] leading-tight mb-6">
          Discover
        </h1>

        {/* Description */}
        <p className="font-quicksand font-bold text-[#a7613c] text-[20px] sm:text-[24px] lg:text-[28px] leading-relaxed mb-8 max-w-2xl mx-auto">
          Soon you'll be able to explore and play public games created by teachers from around the world!
        </p>

        {/* Coming Soon badge */}
        <div className="inline-block">
          <div className="bg-[#96b902] border-[3px] border-[#006029] rounded-[15px] px-8 py-4">
            <span className="font-quicksand font-bold text-white text-[24px] sm:text-[28px] lg:text-[32px]">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Feature hints */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6">
            <div className="w-12 h-12 bg-[#fd9227] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              Browse Games
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Search through thousands of educational games
            </p>
          </div>

          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6">
            <div className="w-12 h-12 bg-[#96b902] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              Top Rated
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Find the most popular and highly-rated games
            </p>
          </div>

          <div className="bg-[#fff6e8] border-3 border-[#473025] rounded-[15px] p-6">
            <div className="w-12 h-12 bg-[#ff9f22] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
              By Subject
            </h3>
            <p className="font-quicksand text-[#a7613c] text-[14px]">
              Filter by subject and difficulty level
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
