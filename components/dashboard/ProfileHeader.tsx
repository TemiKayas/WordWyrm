import Image from 'next/image';

/**
 * teacher profile header with avatar and info
 */

interface ProfileHeaderProps {
  name: string;
  subjects: string;
  avatarImage: string;
  role?: string;
  isOnline?: boolean;
}

export default function ProfileHeader({
  name,
  subjects,
  avatarImage,
  role = 'INSTRUCTOR',
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-4">
      {/* avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 sm:w-[83px] sm:h-[83px] rounded-full overflow-hidden">
          <Image
            src={avatarImage}
            alt={`${name}'s avatar`}
            width={83}
            height={83}
            className="object-cover"
          />
        </div>
      </div>

      {/* profile info */}
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <h2 className="font-quicksand font-bold text-brown text-2xl sm:text-3xl lg:text-4xl">
          {name}
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <p className="font-quicksand font-medium text-[#797979] text-sm sm:text-base tracking-[0.0575px]">
            {subjects}
          </p>
          <div className="bg-[#ececec] rounded-[15px] px-3 py-1">
            <p className="font-quicksand font-bold text-[#9c9c9c] text-xs tracking-[0.0398px]">
              {role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
