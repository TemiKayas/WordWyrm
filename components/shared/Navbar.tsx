'use client';

import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * navigation bar with logo, page links, and sign out
 */

interface NavbarProps {
  title?: string;
  showSignOut?: boolean;
}

export default function Navbar({ title = 'Game Creation', showSignOut = true }: NavbarProps) {

  return (
    <nav className="bg-[#fffaf2] border-b-2 border-[#473025]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* left side: wordwyrm logo only */}
          <Link href="/teacher/dashboard" className="hover:opacity-80 transition-opacity">
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
              <Image
                src="/assets/dashboard/wordwyrm-logo.png"
                alt="WordWyrm"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          {/* center: page title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            {title && (
              <h1 className="text-[#473025] font-quicksand font-bold text-xl">
                {title}
              </h1>
            )}
          </div>

          {/* right side: sign out button */}
          <div className="flex items-center gap-4">
            {showSignOut && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#473025] hover:text-[#ff9f22] transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
