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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/teacher/analytics/${gameId}`}
            className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
          >
            ← Back to Analytics
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-quicksand">Analysis Error</h1>
          <p className="text-gray-600 font-quicksand">{result.error}</p>
        </div>
      </div>
    );
  }

  const { totalStudents, averageScore, averageAccuracy, analysis } = result.data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Link
          href={`/teacher/analytics/${gameId}`}
          className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
        >
          ← Back to Analytics
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 font-quicksand">
            AI Class Performance Analysis
          </h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 font-quicksand font-semibold">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 font-quicksand">{totalStudents}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 font-quicksand font-semibold">Average Score</p>
              <p className="text-2xl font-bold text-gray-900 font-quicksand">{averageScore}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 font-quicksand font-semibold">Average Accuracy</p>
              <p className="text-2xl font-bold text-gray-900 font-quicksand">{averageAccuracy}%</p>
            </div>
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-[#95b607] overflow-hidden">
            <div className="bg-[#95b607] px-6 py-4">
              <h2 className="text-white font-quicksand font-bold text-xl">
                Summary
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 font-quicksand leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Difficult Questions */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-red-400 overflow-hidden">
            <div className="bg-red-400 px-6 py-4">
              <h2 className="text-white font-quicksand font-bold text-xl">
                Most Difficult Questions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analysis.difficultQuestions.map((q, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-900 font-quicksand mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="font-quicksand">
                        <span className="text-gray-600">Success Rate: </span>
                        <span className="font-bold text-red-700">{Math.round(q.successRate)}%</span>
                      </p>
                      <p className="font-quicksand">
                        <span className="text-gray-600">Most Common Wrong Answer: </span>
                        <span className="font-semibold text-gray-900">{q.commonWrongAnswer}</span>
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
            <div className="bg-white rounded-lg shadow-lg border-2 border-orange-400 overflow-hidden">
              <div className="bg-orange-400 px-6 py-4">
                <h2 className="text-white font-quicksand font-bold text-lg">
                  Students Needing Help
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {analysis.studentsNeedingHelp.map((student, index) => (
                    <li key={index} className="font-quicksand text-gray-900 flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      {student}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-green-400 overflow-hidden">
              <div className="bg-green-400 px-6 py-4">
                <h2 className="text-white font-quicksand font-bold text-lg">
                  Top Performers
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {analysis.topPerformers.map((student, index) => (
                    <li key={index} className="font-quicksand text-gray-900 flex items-center gap-2">
                      <span className="text-green-500">•</span>
                      {student}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Teaching Recommendations */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-purple-400 overflow-hidden">
            <div className="bg-purple-400 px-6 py-4">
              <h2 className="text-white font-quicksand font-bold text-xl">
                Teaching Recommendations
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
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
        <div className="mt-8">
          <Link
            href={`/teacher/analytics/${gameId}`}
            className="px-6 py-3 bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold rounded-lg transition-colors inline-block"
          >
            Back to Analytics Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
