'use client';

import Image from 'next/image';
import Button from '@/components/ui/Button';

type EmptyStateProps = {
  onCreateClass: () => void;
};

export default function EmptyState({ onCreateClass }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 pt-20">
      <div className="relative bg-white border-[3px] border-[#473025] rounded-[20px] p-8 max-w-[600px] w-full shadow-xl">
        {/* Welcome Title */}
        <h2 className="font-quicksand font-bold text-[#473025] text-[32px] text-center mb-6">
          Welcome to Your Dashboard!
        </h2>

        {/* Woah Floopa */}
        <div className="-mt-8 mb-6 flex justify-center">
          <Image
            src="/assets/dashboard/woah-floopa.svg"
            alt="Woah Floopa"
            width={400}
            height={280}
            className="object-contain"
          />
        </div>

        <p className="font-quicksand text-[#473025] text-[18px] text-center mb-6">
          You don&apos;t have any classes yet. Create your first class to get started with organizing students and creating games!
        </p>

        <div className="flex justify-center">
          <Button
            onClick={onCreateClass}
            variant="primary"
            size="lg"
            className="text-[20px] px-8"
          >
            + Create Your First Class
          </Button>
        </div>
      </div>
    </div>
  );
}
