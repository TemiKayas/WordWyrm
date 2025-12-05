/**
 * =============================================================================
 * CLASS-WIDE AI ANALYSIS PAGE
 * =============================================================================
 *
 * This page displays AI-generated analysis of the entire class's performance
 * including difficult questions, common mistakes, and teaching recommendations.
 */

import { analyzeClassPerformance } from '@/app/actions/analytics';
import Link from 'next/link';
import { Users, Target, TrendingUp, FileText, AlertTriangle, UserX, Trophy, Lightbulb } from 'lucide-react';

export default async function ClassAnalysisPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  // Get AI analysis
  const result = await analyzeClassPerformance(gameId);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-[#fffaf2] p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/teacher/leaderboard/${gameId}`}
            className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
          >
            ← Back to Game Results
          </Link>
          <h1 className="text-2xl font-bold text-[#473025] mb-4 font-quicksand">Analysis Error</h1>
          <p className="text-[#473025]/70 font-quicksand">{result.error}</p>
        </div>
      </div>
    );
  }

  const { totalStudents, averageScore, averageAccuracy, analysis } = result.data;

  return (
    <div className="min-h-screen bg-[#fffaf2] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Link
          href={`/teacher/leaderboard/${gameId}`}
          className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
        >
          ← Back to Game Results
        </Link>

        {/* Header */}
        <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#473025] mb-4 font-quicksand">
            AI Class Performance Analysis
          </h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 border-2 border-[#FFD700] rounded-[15px] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#473025]/70 font-quicksand font-semibold">Total Students</p>
                <Users size={24} className="text-[#FFD700]" />
              </div>
              <p className="text-2xl font-bold text-[#473025] font-quicksand">{totalStudents}</p>
            </div>
            <div className="bg-gradient-to-br from-[#96b902]/20 to-[#7a9700]/20 border-2 border-[#96b902] rounded-[15px] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#473025]/70 font-quicksand font-semibold">Average Score</p>
                <Target size={24} className="text-[#96b902]" />
              </div>
              <p className="text-2xl font-bold text-[#473025] font-quicksand">{averageScore}</p>
            </div>
            <div className="bg-gradient-to-br from-[#ff9f22]/20 to-[#ff8800]/20 border-2 border-[#ff9f22] rounded-[15px] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#473025]/70 font-quicksand font-semibold">Average Accuracy</p>
                <TrendingUp size={24} className="text-[#ff9f22]" />
              </div>
              <p className="text-2xl font-bold text-[#473025] font-quicksand">{averageAccuracy}%</p>
            </div>
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#95b607] to-[#7a9700] px-6 py-4">
              <h2 className="text-white font-quicksand font-bold text-xl flex items-center gap-2">
                <FileText size={24} />
                Summary
              </h2>
            </div>
            <div className="p-6">
              <p className="text-[#473025] font-quicksand leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Difficult Questions */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#ff9f22] to-[#ff8800] px-6 py-4">
              <h2 className="text-white font-quicksand font-bold text-xl flex items-center gap-2">
                <AlertTriangle size={24} />
                Most Difficult Questions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analysis.difficultQuestions.map((q, index) => (
                  <div key={index} className="p-4 bg-[#ff9f22]/10 rounded-[15px] border-2 border-[#ff9f22]/30">
                    <p className="font-semibold text-[#473025] font-quicksand mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="font-quicksand">
                        <span className="text-[#473025]/70">Success Rate: </span>
                        <span className="font-bold text-[#ff9f22]">{Math.round(q.successRate)}%</span>
                      </p>
                      <p className="font-quicksand">
                        <span className="text-[#473025]/70">Most Common Wrong Answer: </span>
                        <span className="font-semibold text-[#473025]">{q.commonWrongAnswer}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Students Needing Help & Top Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Students Needing Help */}
            <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
              <div className="bg-gradient-to-r from-[#ff9f22] to-[#ff8800] px-6 py-4">
                <h2 className="text-white font-quicksand font-bold text-lg flex items-center gap-2">
                  <UserX size={20} />
                  Students Needing Help
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {analysis.studentsNeedingHelp.map((student, index) => (
                    <li key={index} className="font-quicksand text-[#473025] flex items-center gap-2">
                      <span className="text-[#ff9f22]">•</span>
                      {student}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
              <div className="bg-gradient-to-r from-[#95b607] to-[#7a9700] px-6 py-4">
                <h2 className="text-white font-quicksand font-bold text-lg flex items-center gap-2">
                  <Trophy size={20} />
                  Top Performers
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {analysis.topPerformers.map((student, index) => (
                    <li key={index} className="font-quicksand text-[#473025] flex items-center gap-2">
                      <span className="text-[#95b607]">•</span>
                      {student}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Teaching Recommendations */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#473025] to-[#5a3d30] px-6 py-4">
              <h2 className="text-white font-quicksand font-bold text-xl flex items-center gap-2">
                <Lightbulb size={24} />
                Teaching Recommendations
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-[#95b607] font-bold flex-shrink-0 font-quicksand">
                      {index + 1}.
                    </span>
                    <span className="text-[#473025] font-quicksand">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8">
          <Link
            href={`/teacher/leaderboard/${gameId}`}
            className="px-6 py-3 bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold rounded-[15px] transition-colors inline-block"
          >
            Back to Game Results
          </Link>
        </div>
      </div>
    </div>
  );
}
