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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
                onClick={() => router.push('/teacher/games')}
                variant="primary"
                size="sm"
              >
                All Games
              </Button>
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
                    { bg: 'from-[#96b902]/10 to-[#7a9700]/10', border: 'border-[#96b902]', accent: 'bg-[#96b902]' },
                    { bg: 'from-[#ff9f22]/10 to-[#fd9227]/10', border: 'border-[#ff9f22]', accent: 'bg-[#ff9f22]' },
                    { bg: 'from-[#ff3875]/10 to-[#ff5a8f]/10', border: 'border-[#ff3875]', accent: 'bg-[#ff3875]' },
                    { bg: 'from-[#473025]/10 to-[#5a3d2e]/10', border: 'border-[#473025]', accent: 'bg-[#473025]' },
                  ];
                  const scheme = colorSchemes[index % colorSchemes.length];

                  return (
                    <div
                      key={classItem.id}
                      onClick={() => router.push(`/teacher/class/${classItem.id}`)}
                      className={`bg-gradient-to-br ${scheme.bg} border-[3px] ${scheme.border} rounded-[15px] p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 ${scheme.accent} rounded-[10px] flex items-center justify-center flex-shrink-0`}>
                          <span className="font-quicksand font-bold text-white text-[20px]">
                            {classItem.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-quicksand font-bold text-[#473025] text-[20px] mb-1">
                            {classItem.name}
                          </h3>
                          {classItem.description && (
                            <p className="font-quicksand text-[#473025]/70 text-[14px]">
                              {classItem.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${scheme.accent} text-white font-quicksand font-bold text-[12px]`}>
                          {classItem._count.memberships} students
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 text-[#473025] font-quicksand font-bold text-[12px]">
                          {classItem._count.games} games
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 text-[#473025] font-quicksand font-bold text-[12px]">
                          {classItem._count.pdfs} PDFs
                        </span>
                      </div>
                      {classItem.inviteCodes[0] && (
                        <div className="mt-3 pt-3 border-t border-[#473025]/10">
                          <span className="font-quicksand text-[12px] text-[#473025]/60">
                            Invite Code:
                          </span>
                          <span className="font-quicksand font-bold text-[#473025] ml-2">
                            {classItem.inviteCodes[0].code}
                          </span>
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
