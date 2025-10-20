'use client';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onRetry: () => void;
  onCreateGame: () => void;
}

export default function QuizResults({ score, totalQuestions, onRetry, onCreateGame }: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 70;

  return (
    <div className="min-h-screen bg-[#fffaf2] flex flex-col items-center justify-center p-4">
      {/* results card */}
      <div className="bg-[#f1e8d9] rounded-[26px] p-8 sm:p-12 w-full max-w-[600px] text-center">
        {/* title */}
        <h2 className="font-quicksand font-bold text-brown text-[32px] sm:text-[40px] mb-6">
          Quiz Complete!
        </h2>

        {/* score circle */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            {/* background circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#fffdf9"
              strokeWidth="16"
              fill="none"
            />
            {/* progress circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke={passed ? '#96b902' : '#ff9899'}
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 502.4} 502.4`}
              strokeLinecap="round"
            />
          </svg>
          {/* percentage text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-quicksand font-bold text-brown text-[48px]">
              {percentage}%
            </span>
            <span className="font-quicksand font-semibold text-[#c4a46f] text-[16px]">
              {score} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* message */}
        <p className="font-quicksand font-bold text-brown text-[20px] sm:text-[24px] mb-8">
          {passed
            ? 'Great job! You passed the quiz!'
            : 'Keep practicing! You can do better!'}
        </p>

        {/* action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetry}
            className="bg-[#f1e8d9] hover:bg-[#ede3d8] text-brown font-quicksand font-bold text-[18px] sm:text-[20px] rounded-[14px] h-[56px] sm:h-[66px] px-8 border-2 border-brown transition-all"
          >
            Retry Quiz
          </button>
          <button
            onClick={onCreateGame}
            className="bg-[#96b902] hover:bg-[#7a9700] text-[#fffdfa] font-quicksand font-bold text-[18px] sm:text-[20px] rounded-[14px] h-[56px] sm:h-[66px] px-8 transition-all"
          >
            Create Game
          </button>
        </div>

        {/* breakdown */}
        <div className="mt-8 pt-8 border-t-2 border-[#ede3d8]">
          <div className="grid grid-cols-2 gap-6 text-left">
            <div>
              <p className="font-quicksand text-[#717182] text-[14px] mb-1">Correct Answers</p>
              <p className="font-quicksand font-bold text-[#96b902] text-[24px]">{score}</p>
            </div>
            <div>
              <p className="font-quicksand text-[#717182] text-[14px] mb-1">Incorrect Answers</p>
              <p className="font-quicksand font-bold text-[#ff9899] text-[24px]">{totalQuestions - score}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
