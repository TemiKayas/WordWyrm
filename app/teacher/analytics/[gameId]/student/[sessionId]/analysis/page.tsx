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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/teacher/analytics/${gameId}/student/${sessionId}`}
            className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
          >
            ← Back to Student Details
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-quicksand">Analysis Error</h1>
          <p className="text-gray-600 font-quicksand">{result.error}</p>
        </div>
      </div>
    );
  }

  const { studentName, score, accuracy, analysis } = result.data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href={`/teacher/analytics/${gameId}/student/${sessionId}`}
          className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
        >
          ← Back to Student Details
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-quicksand">
            AI Analysis: {studentName}
          </h1>
          <div className="flex gap-4 text-gray-600 font-quicksand">
            <span>Score: {score}</span>
            <span>•</span>
            <span>Accuracy: {accuracy}%</span>
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="space-y-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <span className="text-2xl">✓</span>
                Strengths
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 font-quicksand leading-relaxed">
                {analysis.strengths}
              </p>
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-red-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <span className="text-2xl">!</span>
                Areas for Improvement
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 font-quicksand leading-relaxed">
                {analysis.weaknesses}
              </p>
            </div>
          </div>

          {/* Patterns Detected */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Patterns Detected
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 font-quicksand leading-relaxed">
                {analysis.patterns}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white font-quicksand flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Recommendations
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-purple-600 font-bold flex-shrink-0 font-quicksand">
                      {index + 1}.
                    </span>
                    <span className="text-gray-700 font-quicksand">{rec}</span>
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
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-quicksand font-bold rounded-lg transition-colors"
          >
            View Question Breakdown
          </Link>
          <Link
            href={`/teacher/analytics/${gameId}`}
            className="px-6 py-3 bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold rounded-lg transition-colors"
          >
            Back to Class Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
