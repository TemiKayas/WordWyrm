'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createGame } from '@/app/actions/game';
import Button from '@/components/ui/Button';

function GameSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gameMode, setGameMode] = useState('tower-defense');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!quizId) {
      router.push('/teacher/upload');
    }
  }, [quizId, router]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!quizId || !title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll just redirect to dashboard
      // In the future, implement actual draft saving logic
      router.push('/teacher/dashboard');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!quizId || !title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      // Create the game
      const result = await createGame({
        quizId,
        title,
        description,
      });

      if (result.success) {
        router.push('/teacher/dashboard');
      } else {
        alert(result.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error publishing game:', error);
      alert('Failed to publish game');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] p-8">
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* step indicator */}
            <div className="relative w-[80px] h-[80px]">
              <Image
                src="/assets/game-preview/step-circle.svg"
                alt="Step 2"
                fill
                className="object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-quicksand font-bold text-white text-[42px]">2</span>
              </div>
            </div>

            <div>
              <h1 className="font-quicksand font-bold text-[#473025] text-[42px]">
                Game Settings
              </h1>
              <p className="font-quicksand font-bold text-[#be9f91] text-[18px]">
                Step 2 of 2
              </p>
            </div>
          </div>

          <p className="font-quicksand font-bold text-[#473025] text-[18px]">
            Game Creation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* left column - cover image and privacy */}
          <div className="space-y-8">
            {/* cover image upload */}
            <div>
              <label className="font-quicksand font-bold text-[#473025] text-[16px] mb-3 block">
                Cover Image
              </label>
              <div className="bg-[#fff6e8] border-[#ffb554] border-[3px] border-dashed rounded-[18px] h-[270px] flex flex-col items-center justify-center relative overflow-hidden">
                {coverImagePreview ? (
                  <div className="absolute inset-0">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                      <div className="bg-white border-[#473025] border-[2px] rounded-[10px] px-6 py-2 hover:bg-[#fff5e8] transition-all">
                        <span className="font-quicksand font-bold text-[#473025] text-[12px]">
                          Upload a File
                        </span>
                      </div>
                    </label>
                  </>
                )}
              </div>
              {coverImagePreview && (
                <button
                  onClick={() => {
                    setCoverImage(null);
                    setCoverImagePreview('');
                  }}
                  className="mt-2 font-quicksand font-bold text-[#ff4880] text-[14px] hover:underline"
                >
                  Remove image
                </button>
              )}
            </div>

            {/* privacy settings */}
            <div>
              <label className="font-quicksand font-bold text-[#473025] text-[24px] mb-4 block">
                Privacy Settings
              </label>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                    isPublic
                      ? 'bg-[#96b902]/10 border-[#96b902]'
                      : 'bg-white border-[#473025]/20 hover:bg-[#fff6e8]'
                  }`}
                  onClick={() => setIsPublic(true)}
                >
                  <div className={`w-[20px] h-[20px] flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    isPublic ? 'border-[#96b902] bg-[#96b902]' : 'border-[#473025]/40'
                  }`}>
                    {isPublic && (
                      <div className="w-[8px] h-[8px] rounded-full bg-white"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="privacy"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="sr-only"
                  />
                  <div>
                    <div className={`font-quicksand font-bold text-[14px] ${
                      isPublic ? 'text-[#96b902]' : 'text-[#473025]'
                    }`}>
                      Public
                    </div>
                    <div className="font-quicksand font-medium text-[#473025]/70 text-[11px]">
                      Playable by Everyone
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all border-2 ${
                    !isPublic
                      ? 'bg-[#96b902]/10 border-[#96b902]'
                      : 'bg-white border-[#473025]/20 hover:bg-[#fff6e8]'
                  }`}
                  onClick={() => setIsPublic(false)}
                >
                  <div className={`w-[20px] h-[20px] flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    !isPublic ? 'border-[#96b902] bg-[#96b902]' : 'border-[#473025]/40'
                  }`}>
                    {!isPublic && (
                      <div className="w-[8px] h-[8px] rounded-full bg-white"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="privacy"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="sr-only"
                  />
                  <div className={`font-quicksand font-bold text-[14px] ${
                    !isPublic ? 'text-[#96b902]' : 'text-[#473025]'
                  }`}>
                    Private
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* right column - title, description, game mode */}
          <div className="space-y-6">
            {/* title */}
            <div>
              <label htmlFor="title" className="font-quicksand font-bold text-[#473025] text-[30px] mb-4 block">
                Title (required)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter game title..."
                className="w-full bg-[#fff6e8] border-[#ffb554] border-[3px] rounded-[17px] h-[50px] px-4 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all"
                required
              />
            </div>

            {/* description */}
            <div>
              <label htmlFor="description" className="font-quicksand font-bold text-[#473025] text-[23px] mb-4 block">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your game..."
                className="w-full bg-[#fff6e8] border-[#ffb554] border-[3px] rounded-[17px] h-[122px] px-4 py-3 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all resize-none"
              />
            </div>

            {/* game mode */}
            <div>
              <label className="font-quicksand font-bold text-[#473025] text-[23px] mb-4 block">
                Game Mode
              </label>
              <div className="flex justify-start">
                {/* Tower Defense */}
                <div className="bg-[#fff6e8] border-[3px] border-[#96b902] rounded-[16px] h-[117px] w-[200px] flex items-center justify-center">
                  <Image
                    src="/assets/dashboard/tower-defense-game-icon.png"
                    alt="Tower Defense"
                    width={150}
                    height={90}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* action buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={handleSaveAsDraft}
                disabled={isLoading || !title.trim()}
                variant="secondary"
                size="md"
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isLoading || !title.trim()}
                variant="success"
                size="md"
                className="flex-1"
                isLoading={isLoading}
              >
                Publish Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
      <div className="text-[#473025] font-quicksand font-bold text-xl">Loading...</div>
    </div>}>
      <GameSettingsContent />
    </Suspense>
  );
}
