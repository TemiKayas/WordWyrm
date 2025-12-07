'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import ClassSelectionModal from './ClassSelectionModal';
import Button from '@/components/ui/Button';

interface SlidingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onHelpClick?: () => void;
}

export default function SlidingSidebar({ isOpen, onClose, onHelpClick }: SlidingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showClassModal, setShowClassModal] = useState(false);

  // Determine role from pathname
  const isStudent = pathname.startsWith('/student');
  const rolePrefix = isStudent ? '/student' : '/teacher';

  const navItems = [
    {
      label: 'Join Game',
      icon: '/assets/dashboard/gamepad-icon.svg',
      inactiveIcon: '/assets/dashboard/gamepad-icon.svg',
      href: '/join',
      active: pathname === '/join',
    },
    {
      label: 'Dashboard',
      icon: '/assets/dashboard/dashboard-icon.svg',
      inactiveIcon: '/assets/dashboard/tabler_apple-filled.svg',
      href: `${rolePrefix}/dashboard`,
      active: pathname === `${rolePrefix}/dashboard`,
    },
    ...(isStudent ? [{
      label: 'History',
      icon: '/assets/dashboard/dashboard-icon.svg',
      href: '/student/history',
      active: pathname === '/student/history' || pathname.startsWith('/student/leaderboard'),
    }] : []),
    {
      label: 'Discover',
      icon: '/assets/dashboard/discover-icon.svg',
      href: `${rolePrefix}/discover`,
      active: pathname === `${rolePrefix}/discover`,
    },
    {
      label: 'Shop',
      icon: '/assets/dashboard/shop-icon.svg',
      href: '/shop',
      active: pathname === '/shop',
    },
  ];


  const handlePlayClick = () => {
    // Students go to /join, teachers go to their games page
    if (isStudent) {
      router.push('/join');
    } else {
      router.push(`${rolePrefix}/games`);
    }
    onClose();
  };

  const handleCreateClick = () => {
    if (!isStudent) {
      setShowClassModal(true);
    } else {
      router.push(`${rolePrefix}/upload`);
      onClose();
    }
  };

  return (
    <>
      {/* Sliding Sidebar - No backdrop overlay */}
      <div
        className={`fixed left-0 top-0 h-screen w-[200px] md:w-[240px] lg:w-[278px] bg-gradient-to-b from-[#fffaf2] to-[#fff5e9] shadow-[4px_0px_12px_rgba(0,0,0,0.15)] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button at top left */}
        <div className="px-4 md:px-6 lg:px-[35px] pt-6 pb-4 flex justify-start">
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle hover:bg-[#473025]/10 text-[#473025] hover:text-[#ff9f22] transition-colors"
            aria-label="Close menu"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Play button */}
        <div className="px-4 md:px-6 lg:px-[35px] mb-4">
          <Button
            onClick={handlePlayClick}
            variant="play"
            size="lg"
            fullWidth
            icon={
              <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
                <Image
                  src="/assets/dashboard/play-icon.svg"
                  alt="Play"
                  fill
                  className="object-contain"
                />
              </div>
            }
            className="h-[50px] md:h-[57px] text-[24px] md:text-[28px] lg:text-[31px]"
          >
            Play
          </Button>
        </div>

        {/* Create button */}
        <div className="px-4 md:px-6 lg:px-[35px] mb-6 md:mb-8">
          <Button
            onClick={handleCreateClick}
            variant="create"
            size="lg"
            fullWidth
            icon={
              <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
                <Image
                  src="/assets/dashboard/create-icon.svg"
                  alt="Create"
                  fill
                  className="object-contain"
                />
              </div>
            }
            className="h-[50px] md:h-[57px] text-[24px] md:text-[28px] lg:text-[31px]"
          >
            Create
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-2 px-4 md:px-6 lg:px-[35px]">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-[9px] transition-all cursor-pointer ${
                item.active
                  ? 'bg-gradient-to-r from-[#473025] from-[79.808%] to-[#231209]'
                  : 'hover:bg-[#473025]/10'
              }`}
            >
              <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
                <Image
                  src={item.active ? item.icon : (item.inactiveIcon || item.icon)}
                  alt={item.label}
                  fill
                  className={`object-contain ${item.active ? 'brightness-0 invert' : ''}`}
                />
              </div>
              <span
                className={`font-quicksand font-bold text-[18px] md:text-[22px] lg:text-[24px] ${
                  item.active ? 'text-[#fff6e9]' : 'text-[#473025]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Help at bottom */}
        <div className="mt-auto px-4 md:px-6 lg:px-[35px] pb-6 md:pb-8">
          <button
            onClick={() => {
              onHelpClick?.();
              onClose();
            }}
            className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-[9px] hover:bg-[#473025]/10 transition-all cursor-pointer w-full"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <circle cx="12" cy="12" r="10" stroke="#473025" strokeWidth="2"/>
                <path d="M12 16V12M12 8H12.01" stroke="#473025" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-quicksand font-bold text-[18px] md:text-[22px] lg:text-[24px] text-[#473025]">
              Help
            </span>
          </button>
        </div>
      </div>

      {/* Class Selection Modal */}
      <ClassSelectionModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          onClose();
        }}
      />
    </>
  );
}
