'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
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

            {/* Classes Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] lg:text-[32px]">
                  My Classes
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#473025] text-[#fffbf6] font-quicksand font-bold px-6 py-2 rounded-[15px] hover:bg-[#5a3d2e] transition-colors"
                >
                  + Create Class
                </button>
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((classItem) => (
                  <div
                    key={classItem.id}
                    onClick={() => router.push(`/teacher/class/${classItem.id}`)}
                    className="bg-[#fffaf2] border-[3px] border-[#473025]/20 rounded-[15px] p-6 cursor-pointer hover:border-[#473025] hover:shadow-md transition-all"
                  >
                    <h3 className="font-quicksand font-bold text-[#473025] text-[20px] mb-2">
                      {classItem.name}
                    </h3>
                    {classItem.description && (
                      <p className="font-quicksand text-[#473025]/70 text-[14px] mb-4">
                        {classItem.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-[14px] font-quicksand text-[#473025]/60">
                      <span>{classItem._count.memberships} students</span>
                      <span>{classItem._count.games} games</span>
                      <span>{classItem._count.pdfs} PDFs</span>
                    </div>
                    {classItem.inviteCodes[0] && (
                      <div className="mt-4 pt-4 border-t border-[#473025]/10">
                        <span className="font-quicksand text-[12px] text-[#473025]/60">
                          Invite Code:
                        </span>
                        <span className="font-quicksand font-bold text-[#473025] ml-2">
                          {classItem.inviteCodes[0].code}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

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
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-[#fffaf2] border-[3px] border-[#473025] text-[#473025] font-quicksand font-bold py-2 rounded-[10px] hover:bg-[#faf4ed] transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#473025] text-[#fffbf6] font-quicksand font-bold py-2 rounded-[10px] hover:bg-[#5a3d2e] transition-colors disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
