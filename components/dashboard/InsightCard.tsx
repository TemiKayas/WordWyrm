import Image from 'next/image';

/**
 * performance insight card with success or warning styling
 */

interface InsightCardProps {
  type: 'success' | 'warning';
  icon: string;
  title: string;
  description: string;
}

export default function InsightCard({ type, icon, title, description }: InsightCardProps) {
  // define colors based on type
  const styles = type === 'success'
    ? {
        bg: 'bg-[#faffd2]',
        border: 'border-[#b0d415]',
        titleColor: 'text-[#386e18]',
        descColor: 'text-[#b0d415]',
      }
    : {
        bg: 'bg-[#ffeef3]',
        border: 'border-[#ff9899]',
        titleColor: 'text-[#7a2626]',
        descColor: 'text-[#ff9899]',
      };

  return (
    <div
      className={`${styles.bg} ${styles.border} border-2 sm:border-[3px] rounded-[15px] min-h-[80px] sm:h-[91px] flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-0 transition-all hover:shadow-md`}
    >
      {/* icon */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 relative flex-shrink-0">
        <Image
          src={icon}
          alt={`${type} icon`}
          fill
          className="object-contain"
        />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className={`font-quicksand font-bold text-sm sm:text-base ${styles.titleColor} mb-1`}>
          {title}
        </p>
        <p className={`font-quicksand font-bold text-xs sm:text-sm ${styles.descColor}`}>
          {description}
        </p>
      </div>
    </div>
  );
}
