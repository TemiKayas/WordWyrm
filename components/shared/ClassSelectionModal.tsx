'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTeacherClasses } from '@/app/actions/class';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
}

export default function ClassSelectionModal({ isOpen, onClose }: ClassSelectionModalProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  async function loadClasses() {
    setIsLoading(true);
    const result = await getTeacherClasses();
    if (result.success) {
      setClasses(result.data);
    }
    setIsLoading(false);
  }

  const handleClassSelect = (classId: string) => {
    router.push(`/teacher/upload?classId=${classId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-[20px] shadow-2xl animate-slide-up overflow-visible relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floopa on top */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-10">
          <div className="w-32 h-32 relative">
            <Image
              src="/assets/dashboard/floopa-character.png"
              alt="Floopa"
              width={128}
              height={128}
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#96b902] to-[#7a9700] p-6 pt-20 relative rounded-t-[20px]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          <h2 className="font-quicksand font-bold text-white text-[24px] pr-10 text-center">
            Select a Class
          </h2>
          <p className="font-quicksand text-white/90 text-[14px] mt-1 text-center">
            Choose which class you want to create a game for
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="font-quicksand text-[#473025]/70 text-[16px]">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-quicksand text-[#473025] text-[18px] mb-4">
                You don&apos;t have any classes yet!
              </p>
              <p className="font-quicksand text-[#473025]/70 text-[14px] mb-6">
                Create a class first to organize your games.
              </p>
              <Button
                onClick={() => {
                  router.push('/teacher/dashboard');
                  onClose();
                }}
                variant="success"
                size="md"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
              {classes.map((classItem) => (
                <button
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem.id)}
                  className="text-left bg-[#fffaf2] border-[3px] border-[#473025]/20 rounded-[15px] p-4 hover:border-[#96b902] hover:bg-white transition-all"
                >
                  <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-1">
                    {classItem.name}
                  </h3>
                  {classItem.description && (
                    <p className="font-quicksand text-[#473025]/70 text-[14px]">
                      {classItem.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
