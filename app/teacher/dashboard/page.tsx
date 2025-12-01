'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import Button from '@/components/ui/Button';
import { getTeacherClasses, createClass } from '@/app/actions/class';

type ClassData = {
  id: string;
  name: string;
  description: string | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

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

        // Fetch classes
        const classesResult = await getTeacherClasses();
        if (classesResult.success) {
          setClasses(classesResult.data);
        } else {
          setError(classesResult.error);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createClass(formData);

    if (result.success) {
      setShowCreateModal(false);
      // Refresh classes
      const classesResult = await getTeacherClasses();
      if (classesResult.success) {
        setClasses(classesResult.data);
      }
      // Navigate to the new class
      router.push(`/teacher/class/${result.data.classId}`);
    } else {
      setError(result.error);
    }

    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading dashboard...
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
          {/* Header with Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[36px]">
                My Classes
              </h1>
              <p className="font-quicksand text-[#473025]/70 text-[16px] mt-1">
                Manage your classes and create new games
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/teacher/discover')}
                variant="orange"
                size="sm"
              >
                Discover Games
              </Button>
              <Button
                onClick={() => router.push('/shop')}
                variant="create"
                size="sm"
              >
                Shop
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-6 md:p-8">

            {/* Classes Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-quicksand font-bold text-[#473025] text-[20px] md:text-[24px]">
                  All Classes
                </h2>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  size="sm"
                >
                  + Create Class
                </Button>
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((classItem, index) => {
                  // Rotate through different color schemes
                  const colorSchemes = [
                    { bg: 'from-[#96b902]/20 to-[#7a9700]/10', border: 'border-[#96b902]', accent: 'bg-[#96b902]', light: 'bg-[#96b902]/10' },
                    { bg: 'from-[#ff9f22]/20 to-[#fd9227]/10', border: 'border-[#ff9f22]', accent: 'bg-[#ff9f22]', light: 'bg-[#ff9f22]/10' },
                    { bg: 'from-[#ff3875]/20 to-[#ff5a8f]/10', border: 'border-[#ff3875]', accent: 'bg-[#ff3875]', light: 'bg-[#ff3875]/10' },
                    { bg: 'from-[#473025]/20 to-[#5a3d2e]/10', border: 'border-[#473025]', accent: 'bg-[#473025]', light: 'bg-[#473025]/10' },
                  ];
                  const scheme = colorSchemes[index % colorSchemes.length];
                  const inviteCode = classItem.inviteCodes[0]?.code;

                  const handleCopyCode = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (inviteCode) {
                      navigator.clipboard.writeText(inviteCode);
                      setCopiedCode(inviteCode);
                      setTimeout(() => setCopiedCode(null), 2000);
                    }
                  };

                  return (
                    <div
                      key={classItem.id}
                      className={`bg-gradient-to-br ${scheme.bg} border-[3px] ${scheme.border} rounded-[20px] overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
                    >
                      {/* Header section - clickable to go to class */}
                      <div
                        onClick={() => router.push(`/teacher/class/${classItem.id}`)}
                        className="p-5 cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 ${scheme.accent} rounded-[12px] flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <span className="font-quicksand font-bold text-white text-[24px]">
                              {classItem.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-quicksand font-bold text-[#473025] text-[20px] mb-1 truncate">
                              {classItem.name}
                            </h3>
                            {classItem.description && (
                              <p className="font-quicksand text-[#473025]/70 text-[14px] line-clamp-2">
                                {classItem.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-quicksand font-bold text-[#473025] text-[14px]">
                              {classItem._count.memberships}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14.5 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H9.5" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 2H16L14 6H10L8 2Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-quicksand font-bold text-[#473025] text-[14px]">
                              {classItem._count.games} games
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-quicksand font-bold text-[#473025] text-[14px]">
                              {classItem._count.pdfs} PDFs
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Invite code section - separate clickable area */}
                      {inviteCode && (
                        <div className={`${scheme.light} border-t-2 ${scheme.border} px-5 py-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 7H18C19.0609 7 20.0783 7.42143 20.8284 8.17157C21.5786 8.92172 22 9.93913 22 11C22 12.0609 21.5786 13.0783 20.8284 13.8284C20.0783 14.5786 19.0609 15 18 15H15" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 15H6C4.93913 15 3.92172 14.5786 3.17157 13.8284C2.42143 13.0783 2 12.0609 2 11C2 9.93913 2.42143 8.92172 3.17157 8.17157C3.92172 7.42143 4.93913 7 6 7H9" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 11H16" stroke="#473025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="font-quicksand text-[13px] text-[#473025]/70">Invite Code:</span>
                              <span className="font-quicksand font-bold text-[#473025] text-[15px] tracking-wider">
                                {inviteCode}
                              </span>
                            </div>
                            <button
                              onClick={handleCopyCode}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                                copiedCode === inviteCode
                                  ? 'bg-[#96b902] text-white'
                                  : 'bg-white hover:bg-[#473025] hover:text-white text-[#473025]'
                              } font-quicksand font-bold text-[12px] transition-all duration-200 shadow-sm cursor-pointer`}
                            >
                              {copiedCode === inviteCode ? (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {classes.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="font-quicksand text-[#473025]/60 text-[18px]">
                      No classes yet. Create your first class to get started!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffbf6] rounded-[15px] border-[3px] border-[#473025] p-8 max-w-md w-full">
            <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-6">
              Create New Class
            </h3>
            <form onSubmit={handleCreateClass}>
              <div className="mb-4">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                  Class Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border-[3px] border-[#473025] rounded-[10px] px-4 py-2 font-quicksand text-[#473025] focus:outline-none focus:border-[#5a3d2e]"
                  placeholder="e.g., Biology 101"
                />
              </div>
              <div className="mb-6">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full border-[3px] border-[#473025] rounded-[10px] px-4 py-2 font-quicksand text-[#473025] focus:outline-none focus:border-[#5a3d2e]"
                  placeholder="Add a description for your class..."
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border-[2px] border-red-400 rounded-[10px] text-red-700 font-quicksand text-[14px]">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Class'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
