'use client';

import Navbar from '@/components/shared/Navbar';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function TeacherDashboard() {
  // mock data - replace with actual data from your backend
  const teacherData = {
    name: 'Bilingual Ben',
    subjects: 'English | Spanish',
    avatarImage: '/assets/dashboard/avatars/teacher-avatar.png',
    role: 'INSTRUCTOR',
    isOnline: true,
  };

  const stats = [
    {
      icon: '/assets/dashboard/icons/people-icon.svg',
      value: 23,
      label: 'Students',
      iconAlt: 'students icon',
    },
    {
      icon: '/assets/dashboard/icons/game-icon.svg',
      value: 7,
      label: 'Games Created',
      iconAlt: 'games icon',
    },
    {
      icon: '/assets/dashboard/icons/chart-icon.svg',
      value: '87%',
      label: 'Avg Score',
      iconAlt: 'chart icon',
    },
    {
      icon: '/assets/dashboard/icons/clock-line-icon.svg',
      value: 31,
      label: 'Hours Played',
      iconAlt: 'clock icon',
    },
  ];

  const activities = [
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
  ];

  const insights = [
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
  ];

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
      />
    </div>
  );
}
