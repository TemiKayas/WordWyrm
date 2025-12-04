'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import Button from '@/components/ui/Button';
import { getTeacherClasses, createClass, updateClassImage, deleteClass } from '@/app/actions/class';
import { gsap } from 'gsap';
import Image from 'next/image';

type ClassData = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    memberships: number;
    pdfs: number;
    games: number;
  };
  inviteCodes: Array<{
    code: string;
    isActive: boolean;
  }>;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  // GSAP animations on mount
  useEffect(() => {
    if (classes.length > 0 && !isLoading) {
      const ctx = gsap.context(() => {
        // Animate header
        gsap.fromTo(headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
        );

        // Animate cards with stagger (filing cabinet effect)
        const cards = cardsRef.current?.querySelectorAll('.class-card');
        gsap.fromTo(cards,
          {
            y: 50,
            opacity: 0,
            scale: 0.9,
            rotateX: -15,
            z: -100
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0,
            z: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.15
          }
        );
      });

      return () => ctx.revert();
    }
  }, [classes, isLoading]);

  async function loadClasses() {
    setIsLoading(true);
    const result = await getTeacherClasses();
    if (result.success) {
      setClasses(result.data);
    }
    setIsLoading(false);
  }

  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const result = await createClass(formData);

    if (result.success) {
      setShowCreateModal(false);
      await loadClasses();
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error);
    }

    setIsCreating(false);
  };

  const handleImageUpload = async (classId: string, file: File) => {
    setUploadingImageFor(classId);
    setOpenMenuId(null);

    const formData = new FormData();
    formData.append('image', file);

    const result = await updateClassImage(classId, formData);

    if (result.success) {
      // Update the class in state
      setClasses(prevClasses =>
        prevClasses.map(c =>
          c.id === classId ? { ...c, imageUrl: result.data.imageUrl } : c
        )
      );
    } else {
      alert(result.error);
    }

    setUploadingImageFor(null);
  };

  const handleImageClick = (classId: string) => {
    fileInputRefs.current[classId]?.click();
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return;
    }

    setOpenMenuId(null);
    const result = await deleteClass(classId);

    if (result.success) {
      // Remove the class from state
      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
    } else {
      alert(result.error);
    }
  };

  if (isLoading) {
    return (
      <TeacherPageLayout>
        <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
          <p className="font-quicksand font-bold text-[#473025] text-[20px]">Loading classes...</p>
        </div>
      </TeacherPageLayout>
    );
  }

  return (
    <TeacherPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 opacity-0">
          <div>
            <h1 className="font-quicksand font-bold text-[#473025] text-[32px] leading-[1.198]">
              My Classes
            </h1>
            <p className="font-quicksand text-[#bfa183] text-[20px] mt-1">
              Manage your classes and create new games
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="sm"
          >
            + Create Class
          </Button>
        </div>

        {/* Classes Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((classItem) => {
            const inviteCode = classItem.inviteCodes[0]?.code;

            const handleCopyCode = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (inviteCode) {
                navigator.clipboard.writeText(inviteCode);
                setCopiedCode(inviteCode);
                setTimeout(() => setCopiedCode(null), 2000);
              }
            };

            const isUploading = uploadingImageFor === classItem.id;
            const isMenuOpen = openMenuId === classItem.id;

            return (
              <div
                key={classItem.id}
                className="class-card bg-white border-[#473025] border-[3px] rounded-[15px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(`/teacher/class/${classItem.id}`)}
              >
                {/* Image Header */}
                <div className="relative h-[120px] border-b-[3px] border-[#473025] overflow-hidden">
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[classItem.id] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(classItem.id, file);
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  {classItem.imageUrl ? (
                    <Image
                      src={classItem.imageUrl}
                      alt={classItem.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-white flex flex-col px-4 pt-12">
                      <p className="font-quicksand font-bold text-[#473025] text-[20px] z-10">
                        {classItem.name}
                      </p>
                      <Image
                        src="/assets/dashboard/woah-floopa.png"
                        alt="Woah Floopa"
                        width={160}
                        height={160}
                        className="object-contain absolute right-0 bottom-0"
                      />
                    </div>
                  )}

                  {/* Student count badge */}
                  <div className="absolute top-2 left-2 bg-[#473025] rounded-[50px] px-3 py-1 flex items-center gap-2 z-20">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#fffaf2"/>
                      <path d="M12 14C6.47715 14 2 16.0147 2 18.5V21C2 21.5523 2.44772 22 3 22H21C21.5523 22 22 21.5523 22 21V18.5C22 16.0147 17.5228 14 12 14Z" fill="#fffaf2"/>
                    </svg>
                    <span className="font-quicksand font-bold text-[#fffaf2] text-[15px]">
                      {classItem._count.memberships}
                    </span>
                  </div>

                  {/* 3 Dots Menu Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : classItem.id);
                    }}
                    className="absolute top-2 right-2 bg-[#473025] hover:bg-[#5a3d2e] rounded-full p-2 transition-all duration-200 hover:scale-110 z-20"
                    title="Class options"
                  >
                      {isUploading ? (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fffaf2" strokeWidth="4"/>
                          <path className="opacity-75" fill="#fffaf2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="5" r="2" fill="#fffaf2"/>
                          <circle cx="12" cy="12" r="2" fill="#fffaf2"/>
                          <circle cx="12" cy="19" r="2" fill="#fffaf2"/>
                        </svg>
                      )}
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute top-14 right-2 bg-white border-[3px] border-[#473025] rounded-[12px] shadow-xl min-w-[180px] overflow-hidden z-30">
                      <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(classItem.id);
                          }}
                          className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-[15px] hover:bg-[#fff6e8] transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M17 8L12 3L7 8M12 3V15" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Change Image
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            router.push(`/teacher/class/${classItem.id}/analytics`);
                          }}
                          className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-[15px] hover:bg-[#fff6e8] transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11L12 14L22 4" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          View Analytics
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            router.push(`/teacher/class/${classItem.id}`);
                          }}
                          className="w-full px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-[15px] hover:bg-[#fff6e8] transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          View Class
                        </button>
                        <div className="border-t-2 border-[#473025]/10" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(classItem.id, classItem.name);
                          }}
                          className="w-full px-4 py-3 text-left font-quicksand font-bold text-red-600 text-[15px] hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Delete Class
                        </button>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-quicksand font-bold text-[#473025] text-[20px] mb-2">
                    {classItem.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <p className="font-quicksand font-bold text-[#bfa183] text-[15px]">
                      Class Invite Code:
                    </p>
                    <p className="font-quicksand font-bold text-[#473025] text-[20px]">
                      {inviteCode || 'N/A'}
                    </p>
                    {inviteCode && (
                      <button
                        onClick={handleCopyCode}
                        className="ml-1 hover:opacity-70 transition-opacity"
                      >
                        {copiedCode === inviteCode ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="#96b902" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M8 8V5C8 3.89543 8.89543 3 10 3H19C20.1046 3 21 3.89543 21 5V14C21 15.1046 20.1046 16 19 16H16M5 8H14C15.1046 8 16 8.89543 16 10V19C16 20.1046 15.1046 21 14 21H5C3.89543 21 3 20.1046 3 19V10C3 8.89543 3.89543 8 5 8Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <div className="bg-[#c8a787] rounded-[50px] px-3 py-1">
                      <span className="font-quicksand font-bold text-[#fffaf2] text-[15px]">
                        {classItem._count.games} Games
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create New Class Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="class-card bg-[#fff6e8] border-[#fd9227] border-[3px] border-dashed rounded-[15px] overflow-hidden cursor-pointer transition-all duration-300 hover:bg-[#ffedd8] hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1"
          >
            {/* Matching Image Header Height */}
            <div className="h-[120px] border-b-[3px] border-[#fd9227] border-dashed flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="#fd9227" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Matching Card Content */}
            <div className="p-4 flex flex-col items-center justify-center min-h-[120px]">
              <p className="font-quicksand font-bold text-[#fd9227] text-[20px] text-center">
                Create New Class
              </p>
              <p className="font-quicksand text-[#fd9227]/70 text-[14px] mt-1">
                Click to get started
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-[3px] border-[#473025] rounded-[20px] p-6 w-full max-w-md">
            <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-4">
              Create New Class
            </h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              {error && (
                <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3">
                  <span className="font-quicksand text-sm text-red-600">{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="name" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-quicksand text-[#473025] focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all"
                  placeholder="e.g., AP English Literature"
                />
              </div>
              <div>
                <label htmlFor="description" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-quicksand text-[#473025] focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all resize-none"
                  placeholder="Add a description for your class..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={isCreating}
                  isLoading={isCreating}
                >
                  Create Class
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </TeacherPageLayout>
  );
}
