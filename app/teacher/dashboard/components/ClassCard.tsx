'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type ClassCardProps = {
  classItem: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    _count: {
      memberships: number;
      games: number;
    };
    inviteCodes: Array<{
      code: string;
      isActive: boolean;
    }>;
  };
  onMenuClick: (classId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
};

export default function ClassCard({ classItem, onMenuClick }: ClassCardProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const inviteCode = classItem.inviteCodes[0]?.code;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(inviteCode);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div
      className="class-card bg-white border-[#473025] border-[3px] rounded-[20px] cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
      onClick={() => router.push(`/teacher/class/${classItem.id}`)}
    >
      {/* Image Header */}
      <div className="relative h-[140px] border-b-[3px] border-[#473025] overflow-visible bg-gradient-to-b from-white to-[#96b902]/10">
        {classItem.imageUrl ? (
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={classItem.imageUrl}
              alt={classItem.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full h-full bg-gradient-to-b from-white to-[#96b902]/10 flex items-end pb-4 px-6 overflow-hidden">
            <p className="font-quicksand font-bold text-[#473025] text-[24px] z-10">
              {classItem.name}
            </p>
            {/* Woah Floopa decoration */}
            <Image
              src="/assets/dashboard/woah-floopa.svg"
              alt="Woah Floopa"
              width={140}
              height={140}
              className="object-contain absolute right-0 bottom-0 opacity-40"
            />
          </div>
        )}

        {/* Student count badge */}
        <div className="absolute top-3 left-3 bg-[#473025] rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#fffaf2"/>
            <path d="M12 14C6.47715 14 2 16.0147 2 18.5V21C2 21.5523 2.44772 22 3 22H21C21.5523 22 22 21.5523 22 21V18.5C22 16.0147 17.5228 14 12 14Z" fill="#fffaf2"/>
          </svg>
          <span className="font-quicksand font-bold text-[#fffaf2] text-[16px]">
            {classItem._count.memberships}
          </span>
        </div>

        {/* 3 Dots Menu Button */}
        <div className="absolute top-3 right-3 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(classItem.id, e);
            }}
            className="cursor-pointer bg-[#ff8c42] rounded-full p-2.5 shadow-[0_3px_0_0_rgba(204,89,33,0.5),0_3px_6px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_0_0_rgba(204,89,33,0.5),0_2px_4px_rgba(0,0,0,0.2)] hover:translate-y-[1px] active:shadow-[0_1px_0_0_rgba(204,89,33,0.5),0_1px_3px_rgba(0,0,0,0.2)] active:translate-y-[2px] transition-all duration-100 ease-out border-b-[2px] border-[#cc5921]/50"
            title="Class options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="2" fill="#fffaf2"/>
              <circle cx="12" cy="12" r="2" fill="#fffaf2"/>
              <circle cx="12" cy="19" r="2" fill="#fffaf2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 bg-[#f8ecdd]">
        {classItem.imageUrl && (
          <h3 className="font-quicksand font-bold text-[#473025] text-[22px] mb-3">
            {classItem.name}
          </h3>
        )}

        <div className="flex items-center gap-2 mb-4">
          <p className="font-quicksand font-semibold text-[#473025]/70 text-[14px]">
            Invite Code:
          </p>
          <p className="font-quicksand font-bold text-[#473025] text-[18px]">
            {inviteCode || 'N/A'}
          </p>
          {inviteCode && (
            <button
              onClick={handleCopyCode}
              className="ml-1 hover:scale-110 active:scale-95 transition-all duration-200 relative group"
            >
              {copiedCode === inviteCode ? (
                <>
                  <div className="relative">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="animate-bounce"
                    >
                      <path d="M20 6L9 17L4 12" stroke="#96b902" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#96b902] to-[#a8cc0a] text-white text-xs font-quicksand font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                    Copied!
                  </span>
                </>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M8 8V5C8 3.89543 8.89543 3 10 3H19C20.1046 3 21 3.89543 21 5V14C21 15.1046 20.1046 16 19 16H16M5 8H14C15.1046 8 16 8.89543 16 10V19C16 20.1046 15.1046 21 14 21H5C3.89543 21 3 20.1046 3 19V10C3 8.89543 3.89543 8 5 8Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-[#473025] to-[#5a3d2f] rounded-full px-4 py-1.5 shadow-sm border-2 border-[#96b902]/20">
            <span className="font-quicksand font-bold text-white text-[15px]">
              {classItem._count.games} Games
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
