'use client';

import { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import StatsCard from './StatsCard';
import TabNavigation from './TabNavigation';
import ActivityCard from './ActivityCard';
import InsightCard from './InsightCard';
import QuizCard from './QuizCard';

/**
 * main dashboard layout combining all components
 */

interface TeacherData {
  name: string;
  subjects: string;
  avatarImage: string;
  role?: string;
  isOnline?: boolean;
}

interface Stat {
  icon: string;
  value: string | number;
  label: string;
  iconAlt?: string;
}

interface Activity {
  studentName: string;
  gameName: string;
  score: number;
  timeAgo: string;
  avatarImage: string;
}

interface Insight {
  type: 'success' | 'warning';
  icon: string;
  title: string;
  description: string;
}

interface Quiz {
  id: string;
  title: string | null;
  numQuestions: number;
  createdAt: Date;
  hasGame: boolean;
  gameId?: string;
  pdfFilename?: string;
}

interface DashboardLayoutProps {
  teacherData: TeacherData;
  stats: Stat[];
  activities: Activity[];
  insights: Insight[];
  selectedClass?: string;
  onUploadClick?: () => void;
  quizzes?: Quiz[];
  onQuizzesUpdate?: () => void;
}

export default function DashboardLayout({
  teacherData,
  stats,
  activities,
  insights,
  selectedClass = 'Spanish B',
  onUploadClick,
  quizzes = [],
  onQuizzesUpdate,
}: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  // render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* left column - recent activity */}
            <div className="bg-cream-dark border-4 border-brown rounded-[15px] p-4 sm:p-6">
              <h3 className="font-quicksand font-bold text-brown text-xl sm:text-2xl mb-2">
                Recent Activity
              </h3>
              <p className="font-quicksand font-bold text-[#c4a46f] text-sm sm:text-base mb-6">
                Latest student interactions
              </p>
              <div className="flex flex-col gap-4">
                {activities.map((activity, index) => (
                  <ActivityCard key={index} {...activity} />
                ))}
              </div>
            </div>

            {/* right column - performance insights */}
            <div className="bg-cream-dark border-4 border-brown rounded-[15px] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <h3 className="font-quicksand font-bold text-brown text-xl sm:text-2xl">
                  Performance Insights
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-quicksand font-bold text-[#c4a46f] text-sm sm:text-base">
                    Class overview for
                  </p>
                  <div className="bg-[#f1e8d9] rounded-[100px] px-4 py-1">
                    <p className="font-quicksand font-bold text-brown text-sm sm:text-base">
                      {selectedClass}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {insights.map((insight, index) => (
                  <InsightCard key={index} {...insight} />
                ))}
              </div>
            </div>
          </div>
        );

      case 'Students':
        return (
          <div className="bg-cream-dark border-4 border-brown rounded-[15px] p-4 sm:p-6">
            <h3 className="font-quicksand font-bold text-brown text-xl sm:text-2xl mb-6">
              Student Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* fake student cards */}
              {[
                { name: 'Allison', class: 'Spanish B', avgScore: 95 },
                { name: 'Evan', class: 'Spanish B', avgScore: 92 },
                { name: 'Floopa', class: 'Spanish B', avgScore: 88 },
                { name: 'Maria', class: 'Spanish B', avgScore: 97 },
                { name: 'Carlos', class: 'Spanish B', avgScore: 85 },
                { name: 'Sophie', class: 'Spanish B', avgScore: 91 },
              ].map((student, index) => (
                <div
                  key={index}
                  className="bg-cream border-2 border-[#c4a46f] rounded-lg p-4 hover:border-brown transition-all"
                >
                  <p className="font-quicksand font-bold text-brown text-lg mb-1">
                    {student.name}
                  </p>
                  <p className="font-quicksand text-[#c4a46f] text-sm mb-2">
                    {student.class}
                  </p>
                  <p className="font-quicksand font-semibold text-brown text-sm">
                    Avg Score: {student.avgScore}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Games':
        return (
          <div className="bg-cream-dark border-4 border-brown rounded-[15px] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-quicksand font-bold text-brown text-xl sm:text-2xl">
                Your Quizzes & Games
              </h3>
              <button
                onClick={onUploadClick}
                className="bg-[#96b902] hover:bg-[#7a9700] text-white font-quicksand font-bold text-sm sm:text-base rounded-lg px-4 py-2 flex items-center gap-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload PDF
              </button>
            </div>

            {quizzes.length === 0 ? (
              <div className="bg-cream rounded-lg p-8 text-center">
                <p className="font-quicksand text-[#c4a46f] text-lg mb-4">
                  No quizzes yet. Upload a PDF to get started!
                </p>
                <button
                  onClick={onUploadClick}
                  className="bg-[#96b902] hover:bg-[#7a9700] text-white font-quicksand font-bold text-base rounded-lg px-6 py-3 transition-all"
                >
                  Upload Your First PDF
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onUpdate={() => onQuizzesUpdate?.()}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'Analytics':
        return (
          <div className="bg-cream-dark border-4 border-brown rounded-[15px] p-4 sm:p-6">
            <h3 className="font-quicksand font-bold text-brown text-xl sm:text-2xl mb-6">
              Analytics & Reports
            </h3>
            <div className="space-y-6">
              {/* fake chart placeholder */}
              <div className="bg-cream rounded-lg p-6 border-2 border-[#c4a46f]">
                <p className="font-quicksand font-bold text-brown text-lg mb-4">
                  Student Performance Over Time
                </p>
                <div className="h-48 flex items-center justify-center bg-[#f1e8d9] rounded">
                  <p className="font-quicksand text-[#c4a46f] text-sm">
                    Chart visualization coming soon
                  </p>
                </div>
              </div>

              {/* stats summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-cream rounded-lg p-4 border-2 border-[#c4a46f]">
                  <p className="font-quicksand font-bold text-brown text-base mb-2">
                    Most Popular Game
                  </p>
                  <p className="font-quicksand text-lg font-bold text-orange">
                    Vocabulary Master
                  </p>
                  <p className="font-quicksand text-[#c4a46f] text-sm">51 plays</p>
                </div>
                <div className="bg-cream rounded-lg p-4 border-2 border-[#c4a46f]">
                  <p className="font-quicksand font-bold text-brown text-base mb-2">
                    Top Student
                  </p>
                  <p className="font-quicksand text-lg font-bold text-orange">
                    Maria
                  </p>
                  <p className="font-quicksand text-[#c4a46f] text-sm">97% avg score</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fef6ec] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* main content container */}
        <div className="bg-cream-dark rounded-[15px] shadow-lg p-4 sm:p-6 lg:p-8">
          {/* profile header */}
          <ProfileHeader {...teacherData} />

          {/* stats cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-8 mb-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          {/* tab navigation */}
          <div className="mb-8">
            <TabNavigation
              tabs={['Overview', 'Students', 'Games', 'Analytics']}
              onTabChange={setActiveTab}
              defaultTab="Overview"
            />
          </div>

          {/* dynamic content based on active tab */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
