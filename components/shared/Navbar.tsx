'use client';

import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * DaisyUI navigation bar with dropdown menu, logo, and sign out
 */

interface NavbarProps {
  showSignOut?: boolean;
  onMenuClick?: () => void;
  logoHref?: string;
}

export default function Navbar({ showSignOut = true, onMenuClick, logoHref = '/teacher/dashboard' }: NavbarProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMenuClick) {
      onMenuClick();
    }
  };

  const handleSignOut = async () => {
    // Use redirect: false to handle the redirect manually
    await signOut({ redirect: false });
    // Manually redirect to login page
    window.location.href = '/login';
  };

  return (
    <div className="navbar bg-[#fffaf2] border-b-2 border-[#473025]/10 h-20 min-h-20">
      <div className="navbar-start">
        {onMenuClick ? (
          <button
            onClick={handleMenuClick}
            className="btn btn-ghost btn-circle hover:bg-[#473025]/10 ml-2"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#473025]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        ) : (
          <div className="w-12"></div>
        )}
      </div>

      <div className="navbar-center">
        <Link href={logoHref} className="cursor-pointer">
          <div className="w-32 h-32 relative">
            <Image
              src="/assets/game-preview/wordwyrm-icon.png"
              alt="WordWyrm"
              fill
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      <div className="navbar-end gap-2">
        {showSignOut && (
          <button
            onClick={handleSignOut}
            className="btn btn-ghost btn-sm font-quicksand font-semibold text-[#473025] hover:text-[#ff9f22]"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
