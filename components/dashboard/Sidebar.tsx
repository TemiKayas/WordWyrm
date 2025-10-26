'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onPlayClick?: () => void;
  onCreateClick?: () => void;
}

export default function Sidebar({ onPlayClick, onCreateClick }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      icon: '/assets/dashboard/dashboard-icon.svg',
      href: '/teacher/dashboard',
      active: pathname === '/teacher/dashboard',
    },
    {
      label: 'Discover',
      icon: '/assets/dashboard/discover-icon.svg',
      href: '/teacher/discover',
      active: pathname === '/teacher/discover',
    },
    {
      label: 'Shop',
      icon: '/assets/dashboard/shop-icon.svg',
      href: '/teacher/shop',
      active: pathname === '/teacher/shop',
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-[200px] md:w-[240px] lg:w-[278px] bg-gradient-to-b from-[#fffaf2] to-[#fff5e9] shadow-[0px_1.625px_1.625px_0px_rgba(0,0,0,0.25)] flex flex-col z-50">
      {/* logo */}
      <div className="pt-5 pl-5 mb-4">
        <Link href="/teacher/dashboard" className="block relative w-[90px] h-[77px] md:w-[110px] md:h-[94px] lg:w-[130px] lg:h-[111px] hover:opacity-80 transition-opacity cursor-pointer">
          <Image
            src="/assets/dashboard/wordwyrm-logo-large.png"
            alt="WordWyrm Logo"
            fill
            className="object-contain"
          />
        </Link>
      </div>

      {/* play button */}
      <div className="px-4 md:px-6 lg:px-[35px] mb-4">
        <button
          onClick={onPlayClick}
          className="btn-primary w-full h-[50px] md:h-[57px] bg-[#95b607] border-[3px] border-[#006029] rounded-[15px] flex items-center gap-2 md:gap-3 px-3 md:px-4 hover:bg-[#7a9700] cursor-pointer"
        >
          <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
            <Image
              src="/assets/dashboard/play-icon.svg"
              alt="Play"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-quicksand font-bold text-white text-[24px] md:text-[28px] lg:text-[31px]">
            Play
          </span>
        </button>
      </div>

      {/* create button */}
      <div className="px-4 md:px-6 lg:px-[35px] mb-6 md:mb-8">
        <button
          onClick={onCreateClick}
          className="btn-primary w-full h-[50px] md:h-[57px] bg-[#ff3875] border-[3px] border-[#730f11] rounded-[15px] flex items-center gap-2 md:gap-3 px-3 md:px-4 hover:bg-[#e6326a] cursor-pointer"
        >
          <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
            <Image
              src="/assets/dashboard/create-icon.svg"
              alt="Create"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-quicksand font-bold text-white text-[24px] md:text-[28px] lg:text-[31px]">
            Create
          </span>
        </button>
      </div>

      {/* navigation items */}
      <nav className="flex flex-col gap-2 px-4 md:px-6 lg:px-[35px]">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-[9px] transition-all cursor-pointer ${
              item.active
                ? 'bg-gradient-to-r from-[#473025] from-[79.808%] to-[#231209]'
                : 'hover:bg-[#473025]/10'
            }`}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
              <Image
                src={item.icon}
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

      {/* settings at bottom */}
      <div className="mt-auto px-4 md:px-6 lg:px-[35px] pb-6 md:pb-8">
        <Link
          href="/teacher/settings"
          className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-[9px] hover:bg-[#473025]/10 transition-all cursor-pointer"
        >
          <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0">
            <Image
              src="/assets/dashboard/settings-gear-icon.svg"
              alt="Settings"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-quicksand font-bold text-[18px] md:text-[22px] lg:text-[24px] text-[#473025]">
            Settings
          </span>
        </Link>
      </div>
    </div>
  );
}