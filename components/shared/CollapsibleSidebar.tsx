'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ClassSelectionModal from './ClassSelectionModal';

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayClick?: () => void;
  onCreateClick?: () => void;
}

export default function CollapsibleSidebar({
  isOpen,
  onClose,
  onPlayClick,
  onCreateClick,
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showClassModal, setShowClassModal] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/teacher/dashboard',
      icon: '/assets/dashboard/dashboard-icon.svg',
      active: pathname === '/teacher/dashboard',
    },
    {
      label: 'Discover',
      href: '/teacher/discover',
      icon: '/assets/dashboard/discover-icon.svg',
      active: pathname === '/teacher/discover',
    },
    {
      label: 'Shop',
      href: '/teacher/shop',
      icon: '/assets/dashboard/shop-icon.svg',
      active: pathname === '/teacher/shop',
    },
  ];

  const handlePlayClick = () => {
    if (onPlayClick) {
      onPlayClick();
    } else {
      router.push('/teacher/games');
    }
    onClose();
  };

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      setShowClassModal(true);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-[240px] lg:w-[278px] bg-gradient-to-b from-[#fffaf2] to-[#fff5e9] shadow-[0px_1.625px_1.625px_0px_rgba(0,0,0,0.25)] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-6 lg:px-[35px] pt-6 pb-4 flex items-center justify-between">
          <Link href="/teacher/dashboard" onClick={onClose}>
            <div className="w-[100px] lg:w-[120px] h-[60px] lg:h-[74px] relative">
              <Image
                src="/assets/game-preview/wordwyrm-icon.png"
                alt="WordWyrm"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden btn btn-ghost btn-sm text-[#473025] hover:text-[#ff9f22] transition-colors min-h-0 h-auto"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-[#473025]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
        </div>

        {/* Play button */}
        <div className="px-6 lg:px-[35px] mb-4">
          <button
            onClick={handlePlayClick}
            className="btn-primary w-full h-[50px] lg:h-[57px] bg-[#95b607] border-[3px] border-[#006029] rounded-[15px] flex items-center gap-3 px-4 hover:bg-[#7a9700] cursor-pointer transition-all"
          >
            <div className="w-6 h-6 relative flex-shrink-0">
              <Image
                src="/assets/dashboard/play-icon.svg"
                alt="Play"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-quicksand font-bold text-white text-[24px] lg:text-[31px]">
              Play
            </span>
          </button>
        </div>

        {/* Create button */}
        <div className="px-6 lg:px-[35px] mb-8">
          <button
            onClick={handleCreateClick}
            className="btn-primary w-full h-[50px] lg:h-[57px] bg-[#ff3875] border-[3px] border-[#730f11] rounded-[15px] flex items-center gap-3 px-4 hover:bg-[#e6326a] cursor-pointer transition-all"
          >
            <div className="w-6 h-6 relative flex-shrink-0">
              <Image
                src="/assets/dashboard/create-icon.svg"
                alt="Create"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-quicksand font-bold text-white text-[24px] lg:text-[31px]">
              Create
            </span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-2 px-6 lg:px-[35px]">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3 rounded-[9px] transition-all cursor-pointer ${
                item.active
                  ? 'bg-gradient-to-r from-[#473025] from-[79.808%] to-[#231209]'
                  : 'hover:bg-[#473025]/10'
              }`}
            >
              <div className="w-6 h-6 relative flex-shrink-0">
                <Image
                  src={item.icon}
                  alt={item.label}
                  fill
                  className={`object-contain ${item.active ? 'brightness-0 invert' : ''}`}
                />
              </div>
              <span
                className={`font-quicksand font-bold text-[22px] lg:text-[24px] ${
                  item.active ? 'text-[#fff6e9]' : 'text-[#473025]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div className="mt-auto px-6 lg:px-[35px] pb-8">
          <Link
            href="/teacher/settings"
            onClick={onClose}
            className="flex items-center gap-4 px-4 py-3 rounded-[9px] hover:bg-[#473025]/10 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 relative flex-shrink-0">
              <Image
                src="/assets/dashboard/settings-gear-icon.svg"
                alt="Settings"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-quicksand font-bold text-[22px] lg:text-[24px] text-[#473025]">
              Settings
            </span>
          </Link>
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
