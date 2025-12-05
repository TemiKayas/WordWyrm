'use client';

import { useRouter } from 'next/navigation';

type ClassMenuProps = {
  classId: string;
  className: string;
  position: { top: number; right: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ClassMenu({
  classId,
  className,
  position,
  onClose,
  onEdit,
  onDelete
}: ClassMenuProps) {
  const router = useRouter();

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
        className="bg-white border-[3px] border-[#473025] rounded-[16px] shadow-2xl min-w-[200px] z-[9999] overflow-hidden"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            router.push(`/teacher/class/${classId}/analytics`);
          }}
          className="w-full px-5 py-3 text-left font-quicksand font-bold text-[#473025] text-[15px] bg-white hover:bg-[#fffaf2] flex items-center gap-3 cursor-pointer transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          View Analytics
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-full px-5 py-3 text-left font-quicksand font-bold text-[#473025] text-[15px] bg-white hover:bg-[#fffaf2] flex items-center gap-3 cursor-pointer transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit Class
        </button>

        <div className="border-t-2 border-[#473025]/10" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-full px-5 py-3 text-left font-quicksand font-bold text-[#473025] text-[15px] bg-white hover:bg-[#fffaf2] flex items-center gap-3 cursor-pointer transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete Class
        </button>
      </div>
    </>
  );
}
