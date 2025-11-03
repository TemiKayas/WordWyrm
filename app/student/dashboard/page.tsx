'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';

export default function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function fetchUser() {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user) {
        setUserName(session.user.name || 'Student');
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9]">
      <Navbar
        showSignOut={true}
        onMenuClick={() => setIsSidebarOpen(true)}
        logoHref="/student/dashboard"
      />

      <SlidingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
          <p className="text-gray-600">
            Welcome to your student dashboard! This is where you&apos;ll see
            your quiz history and join new games.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Join a Game</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter a game code to join a quiz
              </p>
              <input
                type="text"
                placeholder="Enter game code"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">My Results</h3>
              <p className="text-sm text-gray-600">
                View your quiz history and scores
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
