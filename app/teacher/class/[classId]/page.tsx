'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import GamesView from '@/components/dashboard/GamesView';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { Users, Gamepad2 } from 'lucide-react';
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
    imageUrl: string | null;
    createdAt: Date;
    gameMode: string;
  }>;
};

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'students'>('games');

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        userName={teacherData.name}
        userRole={teacherData.role}
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-6">
            <BackButton href="/teacher/dashboard" variant="text">
              Back to Classes
            </BackButton>
          </div>

          {/* Class Header Section */}
          <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[36px] mb-2">
                  {classDetails.name}
                </h1>
                {classDetails.description && (
                  <p className="font-quicksand text-[#473025]/70 text-[16px] mb-4">
                    {classDetails.description}
                  </p>
                )}

                {/* Class Stats in Pills */}
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 bg-[#96b902]/10 border-[2px] border-[#96b902] rounded-full px-4 py-2">
                    <span className="font-quicksand font-bold text-[#473025] text-[18px]">
                      {classDetails.memberships.length}
                    </span>
                    <span className="font-quicksand text-[#473025]/70 text-[14px]">
                      Students
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#fd9227]/10 border-[2px] border-[#fd9227] rounded-full px-4 py-2">
                    <span className="font-quicksand font-bold text-[#473025] text-[18px]">
                      {classDetails.games.length}
                    </span>
                    <span className="font-quicksand text-[#473025]/70 text-[14px]">
                      Games
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#ff3875]/10 border-[2px] border-[#ff3875] rounded-full px-4 py-2">
                    <span className="font-quicksand font-bold text-[#473025] text-[18px]">
                      {classDetails.pdfs.length}
                    </span>
                    <span className="font-quicksand text-[#473025]/70 text-[14px]">
                      PDFs
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowInviteModal(true)}
                variant="primary"
                size="md"
              >
                Invite Students
              </Button>
            </div>
          </div>

          {/* Custom Tabs */}
          <div className="mb-6">
            {/* Tab Headers */}
            <div className="flex gap-2 border-b-2 border-[#473025]/10">
              <button
                onClick={() => setActiveTab('games')}
                className={`font-quicksand font-bold px-6 py-3 flex items-center gap-2 transition-all ${
                  activeTab === 'games'
                    ? 'text-[#fd9227] border-b-3 border-[#fd9227] -mb-[2px]'
                    : 'text-[#473025]/60 hover:text-[#473025]'
                }`}
              >
                <Gamepad2 size={18} />
                Games
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`font-quicksand font-bold px-6 py-3 flex items-center gap-2 transition-all ${
                  activeTab === 'students'
                    ? 'text-[#96b902] border-b-3 border-[#96b902] -mb-[2px]'
                    : 'text-[#473025]/60 hover:text-[#473025]'
                }`}
              >
                <Users size={18} />
                Students
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-[20px] border-2 border-t-0 border-[#473025]/10 p-6 md:p-8">
              {activeTab === 'games' && (
                <GamesView onCreateGame={handleCreateGame} classId={classId} hideTitle={false} />
              )}

              {activeTab === 'students' && (
                <>
                  {classDetails.memberships.length === 0 ? (
                    /* Empty state with Floopa */
                    <div className="text-center py-12">
                      <div className="w-[150px] h-[150px] mx-auto mb-6 relative">
                        <Image
                          src="/assets/dashboard/floopa-character.png"
                          alt="Floopa"
                          width={150}
                          height={150}
                          className="object-contain"
                        />
                      </div>
                      <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
                        No Students Yet
                      </h3>
                      <p className="font-quicksand text-[#473025]/70 text-[16px] mb-6 max-w-md mx-auto">
                        Share your class invite code with students to get started!
                      </p>
                      <Button
                        onClick={() => setShowInviteModal(true)}
                        variant="success"
                        size="md"
                      >
                        View Invite Code
                      </Button>
                    </div>
                  ) : (
                    /* Student roster grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classDetails.memberships.map((membership) => (
                        <div
                          key={membership.id}
                          className="bg-[#fffaf2] border-[3px] border-[#473025]/20 rounded-[15px] p-5 hover:border-[#473025]/40 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#96b902] to-[#7a9700] rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="font-quicksand font-bold text-white text-[20px]">
                                {membership.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-quicksand font-bold text-[#473025] text-[16px] truncate">
                                {membership.user.name}
                              </h3>
                              <p className="font-quicksand text-[#473025]/60 text-[13px] truncate">
                                {membership.user.email}
                              </p>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-[#473025]/10">
                            <p className="font-quicksand text-[#473025]/60 text-[12px]">
                              Joined {new Date(membership.joinedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
                <Button
                  onClick={copyInviteCode}
                  variant={copied ? "success" : "primary"}
                  size="sm"
                  className="min-w-[80px]"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
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

            <Button
              onClick={() => setShowInviteModal(false)}
              variant="primary"
              size="md"
              fullWidth
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
