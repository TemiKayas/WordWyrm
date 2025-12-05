/**
 * =============================================================================
 * INDIVIDUAL STUDENT AI ANALYSIS PAGE
 * =============================================================================
 *
 * This page displays AI-generated analysis of a single student's performance
 * including strengths, weaknesses, patterns, and specific recommendations.
 */

import { analyzeStudentPerformance } from '@/app/actions/analytics';
import Link from 'next/link';
import { CheckCircle, AlertCircle, BarChart3, Lightbulb } from 'lucide-react';

export default async function StudentAnalysisPage({
  params,
}: {
  params: Promise<{ gameId: string; sessionId: string }>;
}) {
  const { gameId, sessionId } = await params;

  // Get AI analysis
  const result = await analyzeStudentPerformance(sessionId);

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

  const { studentName, score, accuracy, analysis } = result.data;

  return (
    <div className="min-h-screen bg-[#fffaf2] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href={`/teacher/leaderboard/${gameId}`}
          className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
        >
          ← Back to Game Results
        </Link>

        {/* Header */}
        <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#473025] mb-2 font-quicksand">
            AI Analysis: {studentName}
          </h1>
          <div className="flex gap-4 text-[#473025]/70 font-quicksand">
            <span>Score: {score}</span>
            <span>•</span>
            <span>Accuracy: {accuracy}%</span>
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="space-y-6">
          {/* Strengths */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#95b607] to-[#7a9700] px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <CheckCircle size={24} />
                Strengths
              </h2>
            </div>
            <div className="p-6">
              <p className="text-[#473025] font-quicksand leading-relaxed">
                {analysis.strengths}
              </p>
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#ff9f22] to-[#ff8800] px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <AlertCircle size={24} />
                Areas for Improvement
              </h2>
            </div>
            <div className="p-6">
              <p className="text-[#473025] font-quicksand leading-relaxed">
                {analysis.weaknesses}
              </p>
            </div>
          </div>

          {/* Patterns Detected */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#473025] to-[#5a3d30] px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <BarChart3 size={24} />
                Patterns Detected
              </h2>
            </div>
            <div className="p-6">
              <p className="text-[#473025] font-quicksand leading-relaxed">
                {analysis.patterns}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 overflow-hidden">
            <div className="bg-gradient-to-r from-[#95b607] to-[#7a9700] px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <Lightbulb size={24} />
                Recommendations
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {analysis.recommendations.map((rec: string, index: number) => (
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
        <div className="mt-8 flex gap-4">
          <Link
            href={`/teacher/analytics/${gameId}/student/${sessionId}`}
            className="px-6 py-3 bg-white border-2 border-[#473025]/20 hover:border-[#95b607] text-[#473025] font-quicksand font-bold rounded-[15px] transition-colors"
          >
            View Question Breakdown
          </Link>
          <Link
            href={`/teacher/leaderboard/${gameId}`}
            className="px-6 py-3 bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold rounded-[15px] transition-colors"
          >
            Back to Game Results
          </Link>
        </div>
      </div>
    </div>
  );
}
