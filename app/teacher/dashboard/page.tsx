'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UploadModal from '@/components/modals/UploadModal';
import { getTeacherStats, getTeacherQuizzes } from '@/app/actions/quiz';
import { Quiz } from '@/lib/processors/ai-generator';

export default function TeacherDashboard() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // real data from backend
  const [teacherData, setTeacherData] = useState({
    name: 'Loading...',
    subjects: '',
    avatarImage: '/assets/dashboard/avatars/teacher-avatar.png',
    role: 'INSTRUCTOR',
    isOnline: true,
  });

  const [stats, setStats] = useState([
    {
      icon: '/assets/dashboard/icons/people-icon.svg',
      value: 0,
      label: 'Students',
      iconAlt: 'students icon',
    },
    {
      icon: '/assets/dashboard/icons/game-icon.svg',
      value: 0,
      label: 'Games Created',
      iconAlt: 'games icon',
    },
    {
      icon: '/assets/dashboard/icons/chart-icon.svg',
      value: '0%',
      label: 'Avg Score',
      iconAlt: 'chart icon',
    },
    {
      icon: '/assets/dashboard/icons/clock-line-icon.svg',
      value: 0,
      label: 'Hours Played',
      iconAlt: 'clock icon',
    },
  ]);

  const [activities] = useState([
    {
      studentName: 'Allison',
      gameName: 'Monkey Swing',
      score: 95,
      timeAgo: '2 minutes ago',
      avatarImage: '/assets/dashboard/avatars/student-1.png',
    },
    {
      studentName: 'Evan',
      gameName: 'Monkey Swing',
      score: 95,
      timeAgo: '1 hour ago',
      avatarImage: '/assets/dashboard/avatars/student-2.png',
    },
    {
      studentName: 'Floopa',
      gameName: 'Monkey Swing',
      score: 95,
      timeAgo: 'Today 10:14am',
      avatarImage: '/assets/dashboard/avatars/student-3.png',
    },
  ]);

  const [insights] = useState([
    {
      type: 'success' as const,
      icon: '/assets/dashboard/icons/check-circle-icon.svg',
      title: 'Great Completion Rate',
      description: 'Students are completing games',
    },
    {
      type: 'warning' as const,
      icon: '/assets/dashboard/icons/help-icon.svg',
      title: 'Grammar Needs Attention',
      description: 'Grammar concepts need more practice (avg: 68%)',
    },
  ]);

  const [quizzes, setQuizzes] = useState<any[]>([]);

  // fetch teacher data and stats on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // fetch stats
        const statsResult = await getTeacherStats();
        if (statsResult.success) {
          const { totalStudents, totalGames, avgScore, totalHoursPlayed } =
            statsResult.data.stats;

          setStats([
            {
              icon: '/assets/dashboard/icons/people-icon.svg',
              value: totalStudents,
              label: 'Students',
              iconAlt: 'students icon',
            },
            {
              icon: '/assets/dashboard/icons/game-icon.svg',
              value: totalGames,
              label: 'Games Created',
              iconAlt: 'games icon',
            },
            {
              icon: '/assets/dashboard/icons/chart-icon.svg',
              value: `${avgScore}%`,
              label: 'Avg Score',
              iconAlt: 'chart icon',
            },
            {
              icon: '/assets/dashboard/icons/clock-line-icon.svg',
              value: totalHoursPlayed,
              label: 'Hours Played',
              iconAlt: 'clock icon',
            },
          ]);
        }

        // fetch quizzes
        const quizzesResult = await getTeacherQuizzes();
        if (quizzesResult.success) {
          setQuizzes(quizzesResult.data.quizzes);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleQuizGenerated = (quiz: Quiz) => {
    // refresh quizzes after generating a new one
    getTeacherQuizzes().then((result) => {
      if (result.success) {
        setQuizzes(result.data.quizzes);
      }
    });
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-brown font-quicksand font-bold text-xl">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      {/* navigation */}
      <Navbar title="Instructor Dashboard" showSignOut={true} />

      {/* main dashboard */}
      <DashboardLayout
        teacherData={teacherData}
        stats={stats}
        activities={activities}
        insights={insights}
        selectedClass="Spanish B"
        onUploadClick={handleOpenUploadModal}
        quizzes={quizzes}
        onQuizzesUpdate={() => {
          getTeacherQuizzes().then((result) => {
            if (result.success) {
              setQuizzes(result.data.quizzes);
            }
          });
        }}
      />

      {/* upload modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onQuizGenerated={handleQuizGenerated}
      />
    </div>
  );
}
