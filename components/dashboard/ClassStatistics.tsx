'use client';

import Image from 'next/image';

interface ClassStatisticsProps {
  averageScore?: number;
  completionData?: {
    allAssignments: number;
    someAssignments: number;
    noAssignments: number;
  };
}

export default function ClassStatistics({
  averageScore = 67,
  completionData = {
    allAssignments: 12,
    someAssignments: 4,
    noAssignments: 1,
  },
}: ClassStatisticsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
      {/* Left Side - Average Class Score */}
      <div className="relative">
        <h3 className="font-quicksand font-bold text-[#473025] text-[20px] leading-[95.85%] mb-4">
          Average Class Score
        </h3>

        {/* Large Score Display */}
        <div className="font-quicksand font-bold text-[#473025] text-[64px] mb-6">
          {averageScore}%
        </div>

        {/* Chart Area */}
        <div className="relative h-[132px]">
          {/* Chart curve image */}
          <div className="absolute inset-0">
            <Image
              src="/assets/dashboard/score-chart-curve.svg"
              alt="Score Chart"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-4">
          <span className="font-quicksand font-bold text-[#473025] text-[20px] leading-[95.85%]">
            0
          </span>
          <span className="font-quicksand font-bold text-[#473025] text-[20px] leading-[95.85%]">
            50
          </span>
          <span className="font-quicksand font-bold text-[#473025] text-[20px] leading-[95.85%]">
            100
          </span>
        </div>

        {/* Vertical divider line */}
        <div className="absolute right-[-2rem] top-8 h-[172px]">
          <Image
            src="/assets/dashboard/vertical-divider-line.svg"
            alt=""
            width={3}
            height={172}
          />
        </div>
      </div>

      {/* Right Side - Overall Assignment Completion */}
      <div className="relative">
        <h3 className="font-quicksand font-bold text-[#473025] text-[20px] leading-[95.85%] mb-8">
          Overall Assignment Completion
        </h3>

        {/* Donut Chart */}
        <div className="absolute right-0 top-20 w-[180px] h-[180px]">
          <Image
            src="/assets/dashboard/completion-donut-chart.svg"
            alt="Completion Chart"
            fill
            className="object-contain"
          />
          {/* Floopa Character in Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[76px] h-[76px]">
            <Image
              src="/assets/dashboard/floopa-character.png"
              alt="Floopa"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Legend Items */}
        <div className="space-y-4 mt-12">
          {/* All Assignments */}
          <div className="flex items-center gap-3">
            <div className="font-quicksand font-bold text-[#96b902] text-[39.529px] leading-normal w-[76px]">
              {completionData.allAssignments}
            </div>
            <div className="font-quicksand font-bold text-[12.078px] leading-[95.85%]">
              <p className="mb-0">
                Students <span className="text-[#96b902]">Completed</span>
              </p>
              <p>All Assignments</p>
            </div>
          </div>

          {/* Some Assignments */}
          <div className="flex items-center gap-3 mt-4">
            <div className="font-quicksand font-bold text-[#2b7fff] text-[39.529px] leading-normal w-[76px]">
              {completionData.someAssignments}
            </div>
            <div className="font-quicksand font-bold text-[12.078px] leading-[95.85%] text-[#473025]">
              <p className="mb-0">
                Students <span className="text-[#2b7fff]">Completed</span>
              </p>
              <p>
                <span className="text-[#2b7fff]">Some</span> Assignments
              </p>
            </div>
          </div>

          {/* No Assignments */}
          <div className="flex items-center gap-3 mt-4">
            <div className="font-quicksand font-bold text-[#ff4880] text-[39.529px] leading-normal w-[76px]">
              {completionData.noAssignments}
            </div>
            <div className="font-quicksand font-bold text-[12.078px] leading-[95.85%] text-[#473025]">
              <p className="mb-0">
                Students <span className="text-[#ff4880]">Completed</span>
              </p>
              <p>
                <span className="text-[#ff4880]">No</span> Assignments
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}