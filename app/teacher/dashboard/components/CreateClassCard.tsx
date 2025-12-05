'use client';

type CreateClassCardProps = {
  onClick: () => void;
};

export default function CreateClassCard({ onClick }: CreateClassCardProps) {
  return (
    <div
      onClick={onClick}
      className="group class-card bg-white border-[#473025] border-[3px] border-dashed rounded-[20px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#ff8c42]"
    >
      {/* Matching Image Header Height */}
      <div className="h-[140px] border-b-[3px] border-[#473025] border-dashed flex items-center justify-center bg-gradient-to-br from-white to-[#fff4e8] transition-colors">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:rotate-90 duration-300">
          <path d="M12 5V19M5 12H19" stroke="#ff8c42" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      {/* Matching Card Content */}
      <div className="p-5 flex flex-col items-center justify-center min-h-[120px] bg-[#fffaf2]">
        <p className="font-quicksand font-bold text-[#473025] text-[20px] text-center">
          Create New Class
        </p>
        <p className="font-quicksand text-[#473025]/60 text-[14px] mt-2">
          Click to get started
        </p>
      </div>
    </div>
  );
}
