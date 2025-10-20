import Image from 'next/image';

/**
 * stat card showing icon, value, and label
 */

interface StatsCardProps {
  icon: string;
  value: string | number;
  label: string;
  iconAlt?: string;
}

export default function StatsCard({ icon, value, label, iconAlt = 'stat icon' }: StatsCardProps) {
  return (
    <div className="bg-cream-dark border-4 border-brown rounded-[15px] h-[120px] sm:h-[155px] w-full flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all hover:shadow-lg">
      {/* icon */}
      <div className="w-7 h-7 sm:w-9 sm:h-9 relative">
        <Image
          src={icon}
          alt={iconAlt}
          fill
          className="object-contain"
        />
      </div>

      {/* value */}
      <p className="font-quicksand font-bold text-brown text-2xl sm:text-3xl lg:text-4xl">
        {value}
      </p>

      {/* label */}
      <p className="font-quicksand font-bold text-brown text-xs sm:text-sm lg:text-base">
        {label}
      </p>
    </div>
  );
}