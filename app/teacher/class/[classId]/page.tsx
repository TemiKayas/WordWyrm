'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GamesView from '@/components/dashboard/GamesView';
import { getClassDetails } from '@/app/actions/class';

type ClassDetails = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  inviteCodes: Array<{
    code: string;
    isActive: boolean;
    usedCount: number;
  }>;
  memberships: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
    joinedAt: Date;
  }>;
  pdfs: Array<{
    id: string;
    filename: string;
    uploadedAt: Date;
  }>;
  games: Array<{
    id: string;
    title: string;
    shareCode: string;
    createdAt: Date;
    gameMode: string;
  }>;
};

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [teacherData, setTeacherData] = useState({
    name: '',
    role: 'INSTRUCTOR',
    photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user session
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session?.user) {
          setTeacherData({
            name: session.user.name || 'Instructor',
            role: 'INSTRUCTOR',
            photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
          });
        }

        // Fetch class details
        const result = await getClassDetails(classId);
        if (result.success) {
          setClassDetails(result.data);
        } else {
          setError(result.error);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch class details:', error);
        setError('Failed to load class details');
        setIsLoading(false);
      }
    }

    fetchData();
  }, [classId]);

  const handleCreateGame = () => {
    // Navigate to upload page with classId as query param
    router.push(`/teacher/upload?classId=${classId}`);
  };

  const copyInviteCode = () => {
    if (classDetails?.inviteCodes[0]) {
      navigator.clipboard.writeText(classDetails.inviteCodes[0].code);
      alert('Invite code copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading class...
        </div>
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#473025] font-quicksand font-bold text-xl mb-4">
            {error || 'Class not found'}
          </div>
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="bg-[#473025] text-[#fffbf6] font-quicksand font-bold px-6 py-2 rounded-[15px] hover:bg-[#5a3d2e] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={true}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        logoHref="/teacher/dashboard"
      />

      <SlidingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        className={`transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'md:ml-[240px] lg:ml-[278px]' : 'ml-0'
        }`}
      >
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-[996px] mx-auto bg-[#fffbf6] rounded-[15px] shadow-lg border-[3px] border-[#473025]/10 min-h-screen p-4 md:p-6 lg:p-8">
            <DashboardHeader
              userName={teacherData.name}
              userRole={teacherData.role}
              userPhoto={teacherData.photo}
            />

            {/* Class Header */}
            <div className="mt-8 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <button
                    onClick={() => router.push('/teacher/dashboard')}
                    className="text-[#473025]/60 font-quicksand text-[14px] mb-2 hover:text-[#473025]"
                  >
                    ← Back to Classes
                  </button>
                  <h2 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[32px]">
                    {classDetails.name}
                  </h2>
                  {classDetails.description && (
                    <p className="font-quicksand text-[#473025]/70 text-[16px] mt-2">
                      {classDetails.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-[#473025] text-[#fffbf6] font-quicksand font-bold px-4 py-2 rounded-[15px] hover:bg-[#5a3d2e] transition-colors"
                >
                  Invite Students
                </button>
              </div>

              {/* Class Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-[#fffaf2] border-[2px] border-[#473025]/20 rounded-[10px] p-4 text-center">
                  <div className="font-quicksand font-bold text-[#473025] text-[24px]">
                    {classDetails.memberships.length}
                  </div>
                  <div className="font-quicksand text-[#473025]/60 text-[14px]">
                    Students
                  </div>
                </div>
                <div className="bg-[#fffaf2] border-[2px] border-[#473025]/20 rounded-[10px] p-4 text-center">
                  <div className="font-quicksand font-bold text-[#473025] text-[24px]">
                    {classDetails.games.length}
                  </div>
                  <div className="font-quicksand text-[#473025]/60 text-[14px]">
                    Games
                  </div>
                </div>
                <div className="bg-[#fffaf2] border-[2px] border-[#473025]/20 rounded-[10px] p-4 text-center">
                  <div className="font-quicksand font-bold text-[#473025] text-[24px]">
                    {classDetails.pdfs.length}
                  </div>
                  <div className="font-quicksand text-[#473025]/60 text-[14px]">
                    PDFs
                  </div>
                </div>
              </div>
            </div>

            {/* Games Section */}
            <div className="mt-8">
              <h3 className="font-quicksand font-bold text-[#473025] text-[20px] mb-4">
                Games
              </h3>
              <GamesView onCreateGame={handleCreateGame} classId={classId} />
            </div>
          </div>
        </main>
      </div>

      {/* Invite Students Modal */}
      {showInviteModal && classDetails.inviteCodes[0] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffbf6] rounded-[15px] border-[3px] border-[#473025] p-8 max-w-md w-full">
            <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-6">
              Invite Students to {classDetails.name}
            </h3>

            <div className="mb-6">
              <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                Class Invite Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#fffaf2] border-[3px] border-[#473025] rounded-[10px] px-4 py-3 font-quicksand font-bold text-[#473025] text-[20px] text-center">
                  {classDetails.inviteCodes[0].code}
                </div>
                <button
                  onClick={copyInviteCode}
                  className="bg-[#473025] text-[#fffbf6] font-quicksand font-bold px-4 rounded-[10px] hover:bg-[#5a3d2e] transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="font-quicksand text-[#473025]/60 text-[12px] mt-2">
                Students used this code {classDetails.inviteCodes[0].usedCount} times
              </p>
            </div>

            <div className="mb-6">
              <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                Share Link
              </label>
              <div className="bg-[#fffaf2] border-[3px] border-[#473025] rounded-[10px] px-4 py-2 font-quicksand text-[#473025] text-[14px] break-all">
                {`${window.location.origin}/join/${classDetails.inviteCodes[0].code}`}
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full bg-[#473025] text-[#fffbf6] font-quicksand font-bold py-2 rounded-[10px] hover:bg-[#5a3d2e] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
