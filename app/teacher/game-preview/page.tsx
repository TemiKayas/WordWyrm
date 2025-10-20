'use client';

import { useState } from 'react';
import Navbar from '@/components/shared/Navbar';

export default function GamePreview() {
  // mock data for now - will be populated from quiz generation
  const [gameData] = useState({
    title: 'Monkey Quest',
    numQuestions: 15,
    playTime: '~8min',
    difficulty: 'Med',
    shareUrl: 'https://wordwyrm.io/play?room=7f93b2c4',
    qrCodeUrl: '/assets/game-preview/qr-code-sample.png',
    imageUrl: '/assets/game-preview/game-thumbnail.png',
  });

  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(gameData.shareUrl);
    setShowCopiedFeedback(true);
    setTimeout(() => {
      setShowCopiedFeedback(false);
    }, 2000);
  };

  const handleLaunchGame = () => {
    alert('Launching game!');
  };

  const handleSaveDraft = () => {
    alert('Draft saved!');
  };

  const handleEditQuestions = () => {
    alert('Edit questions clicked!');
  };

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar title="Game Preview" showSignOut={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* title */}
        <h1 className="font-quicksand font-bold text-brown text-[36px] sm:text-[48px] text-center mb-12">
          Your Game is Ready!
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* left side - game card */}
          <div className="space-y-6">
            {/* game preview card */}
            <div className="bg-[#fffcf8] border-4 border-brown rounded-[15px] p-6">
              {/* game image/thumbnail */}
              <div className="relative w-full aspect-video bg-[#f1e8d9] rounded-[20px] mb-6 overflow-hidden flex items-center justify-center">
                <img
                  src={gameData.imageUrl}
                  alt="Game preview"
                  className="w-full h-full object-cover"
                />
                {/* play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 rounded-full w-20 h-20 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[16px] border-t-transparent border-l-[24px] border-l-brown border-b-[16px] border-b-transparent ml-2"></div>
                  </div>
                </div>
              </div>

              {/* game stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="font-quicksand font-semibold text-[#030213] text-[20px] sm:text-[24px]">
                    {gameData.numQuestions}
                  </p>
                  <p className="font-quicksand text-[#717182] text-[12px] sm:text-[14px]">
                    Questions
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-quicksand font-semibold text-[#030213] text-[20px] sm:text-[24px]">
                    {gameData.playTime}
                  </p>
                  <p className="font-quicksand text-[#717182] text-[12px] sm:text-[14px]">
                    Play Time
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-quicksand font-semibold text-[#030213] text-[20px] sm:text-[24px]">
                    {gameData.difficulty}
                  </p>
                  <p className="font-quicksand text-[#717182] text-[12px] sm:text-[14px]">
                    Difficulty
                  </p>
                </div>
              </div>

              {/* action buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleLaunchGame}
                  className="bg-[#96b902] hover:bg-[#7a9700] text-white font-quicksand font-medium text-[14px] rounded-[8px] h-[32px] px-4 flex items-center gap-2 transition-all"
                >
                  <img
                    src="/assets/game-preview/play-icon.svg"
                    alt="Play"
                    className="w-4 h-4"
                  />
                  Launch Game
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="bg-[#e5e5e5] hover:bg-[#d5d5d5] text-[#030213] font-quicksand font-medium text-[14px] rounded-[8px] h-[32px] px-4 flex items-center gap-2 transition-all"
                >
                  <img
                    src="/assets/game-preview/save-icon.svg"
                    alt="Save"
                    className="w-4 h-4"
                  />
                  Save Draft
                </button>
              </div>
            </div>

            {/* question pool card */}
            <div className="bg-[#fffcf8] border-4 border-brown rounded-[15px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-quicksand font-medium text-[#030213] text-[16px] sm:text-[19px] mb-1">
                    Question Pool
                  </p>
                  <p className="font-quicksand text-[#717182] text-[14px] sm:text-[19px]">
                    {gameData.numQuestions} questions detected
                  </p>
                </div>
                <button
                  onClick={handleEditQuestions}
                  className="font-quicksand font-medium text-[#030213] text-[14px] sm:text-[17px] hover:text-brown transition-colors underline"
                >
                  Edit Questions
                </button>
              </div>
            </div>
          </div>

          {/* right side - qr code and link */}
          <div className="space-y-6">
            {/* qr code */}
            <div className="bg-[#f1e8d9] rounded-[15px] p-8 flex flex-col items-center">
              <div className="bg-[#fffcf8] rounded-[15px] p-6 mb-6">
                <img
                  src={gameData.qrCodeUrl}
                  alt="QR Code"
                  width={270}
                  height={270}
                  className="object-contain"
                />
              </div>

              {/* share link */}
              <div className="w-full max-w-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gameData.shareUrl}
                    readOnly
                    className="flex-1 bg-[#fffcf8] border-2 border-brown rounded-[15px] px-4 py-3 font-quicksand font-bold text-brown text-[13px] sm:text-[15px] text-center focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-[#96b902] hover:bg-[#7a9700] rounded-[11px] w-[49px] h-[46px] flex items-center justify-center transition-all"
                  >
                    <img
                      src="/assets/game-preview/copy-icon.svg"
                      alt="Copy"
                      className="w-7 h-7"
                    />
                  </button>
                </div>

                {/* copied feedback */}
                {showCopiedFeedback && (
                  <div className="mt-3 bg-[#96b902] text-white font-quicksand font-bold text-sm py-2 px-4 rounded-lg text-center transition-opacity">
                    ✓ Link copied to clipboard!
                  </div>
                )}
              </div>
            </div>

            {/* gaming character */}
            <div className="flex justify-center">
              <img
                src="/assets/gaming-floop.png"
                alt="Gaming Floop"
                className="w-full max-w-[364px] h-auto"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
