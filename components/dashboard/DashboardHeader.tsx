'use client';

import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
  userPhoto?: string;
}

export default function DashboardHeader({
  userName,
  userRole = 'INSTRUCTOR',
  userPhoto = '/public/assets/dashboard/avatars/teacher-avatar.png',

}: DashboardHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4 md:gap-0">
      <h1 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[30px] lg:text-[36px]">
        Instructor Dashboard
      </h1>

      <div className="flex items-center gap-3 md:gap-4">
        {/* notification bell */}
        <button className="w-5 h-5 md:w-6 md:h-6 relative hover:opacity-80 transition-opacity cursor-pointer">
          <Image
            src="/assets/dashboard/notification-bell-icon.svg"
            alt="Notifications"
            fill
            className="object-contain"
          />
        </button>

        {/* user profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-quicksand font-bold text-[#473025] text-[18px] md:text-[20px] lg:text-[24px]">
              {userName}
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-1">
            {/* profile photo */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full bg-[#96b902] border-[3px] border-[#473025] cursor-pointer hover:opacity-90 transition-all flex items-center justify-center"
            >
              <span className="font-quicksand font-bold text-white text-[18px] md:text-[20px]">
                {userName.charAt(0).toUpperCase()}
              </span>
            </button>

            {/* role badge */}
            <div className="bg-[#473025] rounded-[41px] px-2 md:px-3 py-0.5">
              <p className="font-quicksand font-bold text-[#fff5e8] text-[10px] md:text-[12px] text-center whitespace-nowrap">
                {userRole}
              </p>
            </div>

            {/* dropdown menu */}
            {showDropdown && (
              <div className="absolute top-12 right-0 mt-2 w-36 bg-white border-2 border-[#473025] rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left font-quicksand font-bold text-[#ff4880] text-sm hover:bg-[#fff5e8] transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}