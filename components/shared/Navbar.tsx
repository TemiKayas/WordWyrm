'use client';

import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { useState } from 'react';
import { useProfile } from '@/lib/contexts/ProfileContext';

/**
 * DaisyUI navigation bar with dropdown menu, logo, and sign out
 */

interface NavbarProps {
  showSignOut?: boolean;
  onMenuClick?: () => void;
  logoHref?: string;
  userName?: string;
  userRole?: string;
}

export default function Navbar({
  showSignOut = true,
  onMenuClick,
  logoHref = '/teacher/dashboard',
  userName,
  userRole
}: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  useProfile();

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMenuClick) {
      onMenuClick();
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <div className="navbar bg-[#fffaf2] border-b-2 border-[#473025]/10 h-20 md:h-24 min-h-20 md:min-h-24 px-4">
      <div className="navbar-start">
        {onMenuClick ? (
          <button
            onClick={handleMenuClick}
            className="btn btn-ghost btn-circle hover:bg-[#473025]/10 text-[#473025] hover:text-[#ff9f22] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-12"></div>
        )}
      </div>

      <div className="navbar-center flex items-center">
        <Link href={logoHref} className="cursor-pointer">
          <div className="w-40 h-40 md:w-48 md:h-48 relative">
            <Image
              src="/assets/LearnWyrm.svg"
              alt="LearnWyrm"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      <div className="navbar-end gap-2 md:gap-4">
        {/* User Profile Section */}
        {userName && (
          <>
            {/* Notifications */}
            <button
              className="btn btn-ghost btn-circle hover:bg-[#473025]/10 text-[#473025] hover:text-[#ff9f22] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={22} strokeWidth={2} />
            </button>

            {/* User Name (hidden on mobile) */}
            <div className="hidden md:flex flex-col items-end">
              <span className="font-quicksand font-bold text-[#473025] text-[16px]">
                {userName}
              </span>
              {userRole && (
                <span className="font-quicksand text-[#473025]/60 text-[12px]">
                  {userRole}
                </span>
              )}
            </div>

            {/* User Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="btn btn-circle bg-[#473025] border-2 border-[#473025] hover:bg-[#5a3d2e] p-0 overflow-hidden"
                aria-label="User menu"
              >
                <Image
                  src="/assets/dashboard/floopa-character.png"
                  alt="Profile"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#473025] rounded-lg shadow-lg overflow-hidden z-20">
                    <div className="px-4 py-3 border-b border-[#473025]/10">
                      <p className="font-quicksand font-bold text-[#473025] text-[14px]">
                        {userName}
                      </p>
                      {userRole && (
                        <p className="font-quicksand text-[#473025]/60 text-[12px]">
                          {userRole}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left font-quicksand font-bold text-[#ff4880] text-[14px] hover:bg-[#fff5e8] transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Legacy Sign Out Button (when no userName) */}
        {!userName && showSignOut && (
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
