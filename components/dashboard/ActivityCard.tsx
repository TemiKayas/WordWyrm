import Image from 'next/image';

/**
 * displays recent student activity with avatar and score
 */

interface ActivityCardProps {
  studentName: string;
  gameName: string;
  score: number;
  timeAgo: string;
  avatarImage: string;
}

export default function ActivityCard({
  studentName,
  gameName,
  score,
  timeAgo,
  avatarImage,
}: ActivityCardProps) {
  return (
    <div className="bg-cream-dark border-2 sm:border-[3px] border-[#c4a46f] rounded-[15px] min-h-[65px] sm:h-[73px] flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 sm:py-0 hover:border-brown transition-all">
      {/* avatar */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 relative rounded-full overflow-hidden flex-shrink-0">
        <Image
          src={avatarImage}
          alt={`${studentName}'s avatar`}
          fill
          className="object-cover"
        />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className="font-quicksand font-bold text-brown text-sm sm:text-base truncate">
          {studentName} completed &quot;{gameName}&quot;
        </p>
        <p className="font-quicksand font-bold text-[#c4a46f] text-xs sm:text-sm">
          Score: {score}% • {timeAgo}
        </p>
      </div>
    </div>
  );
}
