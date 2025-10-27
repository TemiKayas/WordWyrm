'use client';

import Image from 'next/image';

interface Student {
  name: string;
  workCompleted: string;
  averageScore: string;
  email: string;
  avatar: string;
}

interface StudentsTableProps {
  students?: Student[];
}

// function to get progress bar color based on completion
function getProgressBarColor(completed: string): string {
  const [current] = completed.split('/').map(Number);

  if (current === 10) return 'bg-[#b8d416]';
  if (current === 9) return 'bg-[#e3ff47]';
  if (current === 8) return 'bg-[#f2ff65]';
  if (current === 7) return 'bg-[#f8f248]';
  if (current === 6) return 'bg-[#ffdd47]';
  if (current === 5) return 'bg-[#f8b148]';
  if (current === 4) return 'bg-[#ff8f44]';
  if (current === 3) return 'bg-[#f0593f]';
  if (current === 2) return 'bg-[#ff4880]';
  if (current === 1) return 'bg-[#de3ca8]';
  return 'bg-[#fffbf6]';
}

// function to calculate progress percentage
function getProgressPercentage(completed: string): number {
  const [current, total] = completed.split('/').map(Number);
  return (current / total) * 100;
}

export default function StudentsTable({
  students = [
    {
      name: 'Allison Cho',
      workCompleted: '10/10',
      averageScore: '100%',
      email: 'allycho@bu.edu',
      avatar: '/assets/dashboard/instructor-profile-photo.png',
    },
    {
      name: 'Evan Jaquez',
      workCompleted: '9/10',
      averageScore: '100%',
      email: 'jaquevan@bu.edu',
      avatar: '/assets/dashboard/student-avatar-evan.png',
    },
    {
      name: 'Ed Lu',
      workCompleted: '8/10',
      averageScore: '100%',
      email: 'adefifp@bu.edu',
      avatar: '/assets/dashboard/student-avatar-ed.png',
    },
    {
      name: 'Allison Cho',
      workCompleted: '7/10',
      averageScore: '100%',
      email: 'allycho@bu.edu',
      avatar: '/assets/dashboard/instructor-profile-photo.png',
    },
    {
      name: 'Evan Jaquez',
      workCompleted: '6/10',
      averageScore: '100%',
      email: 'jaquevan@bu.edu',
      avatar: '/assets/dashboard/student-avatar-evan.png',
    },
    {
      name: 'Ed Lu',
      workCompleted: '5/10',
      averageScore: '100%',
      email: 'adefifp@bu.edu',
      avatar: '/assets/dashboard/student-avatar-ed.png',
    },
  ],
}: StudentsTableProps) {
  return (
    <div className="rounded-[25px] p-4 md:p-6 lg:p-8 overflow-x-auto">
      <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] lg:text-[32px] leading-[1.198] mb-6 md:mb-8">
        Students
      </h2>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-4">
        <div className="font-quicksand font-bold text-[#473025] text-[14px] lg:text-[16px] leading-[95.85%] text-center">
          Name
        </div>
        <div className="font-quicksand font-bold text-[#473025] text-[14px] lg:text-[16px] leading-[95.85%] text-center">
          Work Completed
        </div>
        <div className="font-quicksand font-bold text-[#473025] text-[14px] lg:text-[16px] leading-[95.85%] text-center">
          Average Score
        </div>
        <div className="font-quicksand font-bold text-[#473025] text-[14px] lg:text-[16px] leading-[95.85%] text-center">
          Email
        </div>
      </div>

      {/* Student Rows */}
      <div className="space-y-3">
        {students.map((student, index) => (
          <div
            key={index}
            className="bg-[#fffbf6] border-[3px] border-[#473025] rounded-[15px] h-auto md:h-[70px] lg:h-[82px] grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-center p-4 md:px-6 hover:bg-[#fff5e8] hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          >
            {/* Name & Avatar */}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="relative w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex-shrink-0 rounded-full overflow-hidden border-[3px] border-[#473025]">
                <Image
                  src={student.avatar}
                  alt={student.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] leading-[95.85%]">
                {student.name}
              </span>
            </div>

            {/* work completed progress bar */}
            <div className="flex items-center justify-center">
              <div className="relative bg-[#fffbf6] border-[2.5px] border-[#473025] rounded-[5px] h-[28px] md:h-[32px] w-[100px] md:w-[119px] overflow-hidden">
                {/* progress fill */}
                {student.workCompleted !== '0/10' && (
                  <div
                    className={`absolute left-0 top-0 h-full ${getProgressBarColor(
                      student.workCompleted
                    )} ${getProgressPercentage(student.workCompleted) < 100 ? 'border-r-[2.5px] border-[#473025]' : ''}`}
                    style={{
                      width: `calc(${getProgressPercentage(student.workCompleted)}% - ${getProgressPercentage(student.workCompleted) === 100 ? '0px' : '0px'})`,
                    }}
                  />
                )}
                {/* text overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] leading-[95.85%] relative z-10">
                    {student.workCompleted}
                  </span>
                </div>
              </div>
            </div>

            {/* average score */}
            <div className="text-center">
              <span className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] leading-[95.85%]">
                {student.averageScore}
              </span>
            </div>

            {/* email */}
            <div className="text-center md:text-right">
              <a
                href={`mailto:${student.email}`}
                className="font-quicksand font-bold text-[#473025] text-[13px] md:text-[16px] leading-[95.85%] hover:text-[#ff9f22] transition-colors break-all"
              >
                {student.email}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
