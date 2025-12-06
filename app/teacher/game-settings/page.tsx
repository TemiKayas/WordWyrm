'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createGame } from "@/app/actions/game";
import { getQuizById, updateQuizQuestions } from "@/app/actions/quiz";
import Button from "@/components/ui/Button";
import TeacherPageLayout from "@/components/shared/TeacherPageLayout";
import MultiStepIndicator from "@/components/fileupload/MultiStepIndicator";
import { GameMode } from "@prisma/client";
import Image from "next/image";
import { List } from "react-window";
import type { RowComponentProps } from "react-window";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

interface QuestionButtonProps {
  indices: number[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  type: string;
}

const QuestionNumberButton = ({
  index,
  style,
  indices,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  type,
}: RowComponentProps<QuestionButtonProps>) => {
  const questionNumber = indices[index];
  const isCurrent = questionNumber === currentQuestionIndex;

  let className =
    "w-full h-full rounded-[6px] font-quicksand font-bold text-[12px] transition-all flex items-center justify-center";
  if (type === "confirmed") {
    className += isCurrent
      ? " bg-[#96b902] text-white border-[2px] border-[#006029]"
      : " bg-white text-[#473025] border-[2px] border-[#96b902] hover:bg-[#96b902]/10";
  } else {
    className += isCurrent
      ? " bg-[#ff9f22] text-white border-[2px] border-[#cc7425]"
      : " bg-white text-[#473025] border-[2px] border-[#ff9f22] hover:bg-[#ff9f22]/10";
  }

  return (
    <div style={style} className="p-1">
      <button
        onClick={() => setCurrentQuestionIndex(questionNumber)}
        className={className}
      >
        {questionNumber + 1}
      </button>
    </div>
  );
};

function GameSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Game settings state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TOWER_DEFENSE);
  const [selectedClass, setSelectedClass] = useState('Class 1');

  // Quiz questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [reviewedQuestions, setReviewedQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [pdfFilename, setPdfFilename] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const steps = [
    { number: 1, label: 'Settings' },
    { number: 2, label: 'Questions' },
    { number: 3, label: 'Launch Game' },
  ];

  useEffect(() => {
    if (!quizId) {
      router.push('/teacher/upload');
      return;
    }

    async function loadQuizData() {
      if (!quizId) return;

      const result = await getQuizById(quizId);
      if (result.success) {
        const quiz = result.data.quiz;
        const quizData = typeof quiz.quizJson === 'string'
          ? JSON.parse(quiz.quizJson)
          : quiz.quizJson as unknown as Quiz;

        setTitle(quiz.title || '');
        setQuestions(quizData.questions);
        const pdfFilename = (quiz as {processedContent?: {pdf?: {filename?: string}}}).processedContent?.pdf?.filename || 'Unknown PDF';
        setPdfFilename(pdfFilename);
      }
      setIsLoading(false);
    }

    loadQuizData();
  }, [quizId, router]);

  const handleApproveQuestion = () => {
    const newReviewed = new Set(reviewedQuestions);
    newReviewed.add(currentQuestionIndex);
    setReviewedQuestions(newReviewed);

    // Move to next question if available
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleDenyQuestion = () => {
    // Remove the question from the array
    const newQuestions = questions.filter((_, index) => index !== currentQuestionIndex);
    setQuestions(newQuestions);

    // Update reviewed questions indices to account for removed question
    const newReviewed = new Set<number>();
    reviewedQuestions.forEach(index => {
      if (index < currentQuestionIndex) {
        newReviewed.add(index);
      } else if (index > currentQuestionIndex) {
        newReviewed.add(index - 1);
      }
    });
    setReviewedQuestions(newReviewed);

    // Adjust current question index if needed
    if (currentQuestionIndex >= newQuestions.length && newQuestions.length > 0) {
      setCurrentQuestionIndex(newQuestions.length - 1);
    } else if (newQuestions.length === 0) {
      // If all questions are denied, you might want to handle this case
      setCurrentQuestionIndex(0);
    }
  };

  const handlePublish = async () => {
    if (!quizId || !title.trim()) {
      setSaveMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    setIsSaving(true);
    try {
      // First save the questions
      const quizData: Quiz = { questions };
      const updateResult = await updateQuizQuestions(quizId, quizData);

      if (!updateResult.success) {
        setSaveMessage({ type: 'error', text: 'Failed to save questions' });
        setIsSaving(false);
        return;
      }

      // Then create the game
      const result = await createGame({
        quizId,
        title,
        description,
        gameMode,
        isPublic, // Pass the public/private setting
      });

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Game published successfully! Redirecting...' });
        setTimeout(() => {
          router.push('/teacher/games');
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to create game' });
      }
    } catch (error) {
      console.error('Error publishing game:', error);
      setSaveMessage({ type: 'error', text: 'Failed to publish game' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">Loading quiz...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const confirmedCount = reviewedQuestions.size;
  const confirmedIndices = Array.from(reviewedQuestions);
  const underReviewIndices = questions
    .map((_, index) => index)
    .filter((index) => !reviewedQuestions.has(index));

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 py-4 border-b-2 border-[#e7d6c4]">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-2 mb-2 text-[14px] font-quicksand">
            <span className="text-[#a7613c]">Dashboard</span>
            <span className="text-[#a7613c]">{'>'}</span>
            <span className="text-[#ff9f22] font-semibold">Review & Publish Game</span>
          </div>
          <h1 className="font-quicksand font-bold text-[#473025] text-[28px] leading-tight">
            {title || 'Untitled Game'}
          </h1>
        </div>
      </div>

      {/* Multi-Step Progress Indicator - Fixed */}
      <div className="flex-shrink-0 px-6 py-4">
        <div className="max-w-[1000px] mx-auto">
          <MultiStepIndicator currentStep={currentStep} steps={steps} />
        </div>
      </div>

      {/* Save Message - Fixed */}
      {saveMessage && (
        <div className="flex-shrink-0 px-6">
          <div className="max-w-[1000px] mx-auto">
            <div
              className={`mb-4 p-3 rounded-[8px] border-2 animate-fade-in ${
                saveMessage.type === 'success'
                  ? 'bg-[#96b902]/10 border-[#96b902] text-[#7a9700]'
                  : 'bg-red-50 border-red-500 text-red-700'
              }`}
            >
              <p className="font-quicksand font-semibold text-[13px]">{saveMessage.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-[1000px] mx-auto">
          {/* Step 1: Settings */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Left Column - Game Details */}
                <div className="space-y-4">
                  {/* Game Title */}
                  <div>
                    <label htmlFor="title" className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                      Game Title<span className="text-[#ff4880]">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter game title"
                      className="w-full bg-white border-[2px] border-[#473025] rounded-[8px] h-[45px] px-4 font-quicksand font-semibold text-[#473025] text-[14px] placeholder:text-[#be9f91] focus:outline-none focus:border-[#ff9f22] transition-all"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                      Description
                    </label>
                    <div className="relative">
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                        placeholder="Enter a brief description of your game..."
                        className="w-full bg-white border-[2px] border-[#473025] rounded-[8px] h-[150px] px-4 py-3 font-quicksand text-[#473025] text-[14px] placeholder:text-[#be9f91] focus:outline-none focus:border-[#ff9f22] transition-all resize-none"
                        maxLength={100}
                      />
                      <div className="absolute bottom-3 right-3 text-[#a7613c] font-quicksand text-[12px]">
                        {description.length}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Game Mode Selection */}
                <div>
                  <label className="font-quicksand font-bold text-[#473025] text-[14px] mb-2 block">
                    Select Game Mode<span className="text-[#ff4880]">*</span>
                  </label>
                  <div className="space-y-3">
                    {/* Tower Defense */}
                    <div
                      onClick={() => setGameMode(GameMode.TOWER_DEFENSE)}
                      className={`cursor-pointer rounded-[8px] border-[2px] p-3 transition-all flex items-start gap-3 ${
                        gameMode === GameMode.TOWER_DEFENSE
                          ? 'border-[#96b902] bg-white'
                          : 'border-[#d1c5b8] bg-white hover:border-[#ff9f22]'
                      }`}
                    >
                      <div className={`w-[20px] h-[20px] flex-shrink-0 rounded-full border-[2px] flex items-center justify-center transition-all mt-1 ${
                        gameMode === GameMode.TOWER_DEFENSE ? 'border-[#96b902] bg-white' : 'border-[#a7613c] bg-white'
                      }`}>
                        {gameMode === GameMode.TOWER_DEFENSE && (
                          <div className="w-[10px] h-[10px] rounded-full bg-[#96b902]"></div>
                        )}
                      </div>
                      <div className="w-[120px] h-[80px] bg-[#f1e8d9] rounded-[6px] overflow-hidden flex-shrink-0">
                        <Image
                          src="/assets/game/GrassMap1080p.png"
                          alt="Tower Defense"
                          width={120}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-quicksand font-bold text-[#473025] text-[15px] mb-1">
                          Tower Defense
                        </h3>
                        <p className="font-quicksand text-[#a7613c] text-[12px] leading-tight">
                          Defend your kingdom against waves of enemies. Answer questions to build your army!
                        </p>
                      </div>
                    </div>

                    {/* Snake Game */}
                    <div
                      onClick={() => setGameMode(GameMode.SNAKE)}
                      className={`cursor-pointer rounded-[8px] border-[2px] p-3 transition-all flex items-start gap-3 ${
                        gameMode === GameMode.SNAKE
                          ? 'border-[#96b902] bg-white'
                          : 'border-[#d1c5b8] bg-white hover:border-[#ff9f22]'
                      }`}
                    >
                      <div className={`w-[20px] h-[20px] flex-shrink-0 rounded-full border-[2px] flex items-center justify-center transition-all mt-1 ${
                        gameMode === GameMode.SNAKE ? 'border-[#96b902] bg-white' : 'border-[#a7613c] bg-white'
                      }`}>
                        {gameMode === GameMode.SNAKE && (
                          <div className="w-[10px] h-[10px] rounded-full bg-[#96b902]"></div>
                        )}
                      </div>
                      <div className="w-[120px] h-[80px] bg-[#d1c5b8] rounded-[6px] flex items-center justify-center flex-shrink-0">
                        <span className="font-quicksand text-[#a7613c] text-[11px]">Preview coming soon</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-quicksand font-bold text-[#473025] text-[15px] mb-1">
                          Snake Game
                        </h3>
                        <p className="font-quicksand text-[#a7613c] text-[12px] leading-tight">
                          Slither your way to victory! Choose the right answer and avoid the wrong ones.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!title.trim()}
                  variant="primary"
                  size="md"
                  className="min-w-[200px]"
                >
                  Continue to Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <p className="font-quicksand text-[#a7613c] text-[13px] mb-4">
                Our AI assistant has created questions based off of your source material.
                Now all you have to do is confirm the questions or make any changes you'd like!
              </p>

              <div className="grid grid-cols-[1fr_250px] gap-6">
                {/* Question Card */}
                <div>
                  {currentQuestion && (
                    <div className="border-[2px] border-[#473025] rounded-[12px] p-5 bg-white">
                      {/* Question Number Badge */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-[50px] h-[50px] bg-[#473025] rounded-[8px] flex items-center justify-center flex-shrink-0">
                          <span className="font-quicksand font-bold text-white text-[18px]">
                            Q{currentQuestionIndex + 1}
                          </span>
                        </div>
                        <h3 className="font-quicksand font-bold text-[#473025] text-[16px] flex-1">
                          {currentQuestion.question}
                        </h3>
                      </div>

                      {/* Correct Answer Indicator */}
                      <div className="mb-4 flex items-center gap-2">
                        <span className="font-quicksand font-semibold text-[#473025] text-[13px]">
                          Correct answer:
                        </span>
                        <div className="bg-[#ff9f22] text-white font-quicksand font-bold text-[13px] px-3 py-1 rounded-[6px]">
                          {String.fromCharCode(65 + currentQuestion.options.indexOf(currentQuestion.answer))}
                        </div>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2 mb-5">
                        {currentQuestion.options.map((option, optionIndex) => {
                          const isCorrect = option === currentQuestion.answer;
                          const letter = String.fromCharCode(65 + optionIndex);
                          return (
                            <div
                              key={optionIndex}
                              className={`flex items-start gap-3 p-3 rounded-[8px] border-[2px] ${
                                isCorrect
                                  ? 'border-[#ff9f22] bg-[#fff6e8]'
                                  : 'border-[#e7d6c4] bg-white'
                              }`}
                            >
                              <div className={`w-[32px] h-[32px] flex-shrink-0 rounded-[6px] flex items-center justify-center font-quicksand font-bold text-[14px] ${
                                isCorrect ? 'bg-[#ff9f22] text-white' : 'bg-[#f1e8d9] text-[#473025]'
                              }`}>
                                {letter}
                              </div>
                              <p className="font-quicksand text-[#473025] text-[14px] flex-1 mt-1">
                                {option}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Approve/Deny Buttons */}
                      <div className="flex justify-center gap-3">
                        <Button
                          onClick={handleDenyQuestion}
                          variant="danger"
                          size="md"
                          className="min-w-[140px]"
                        >
                          DENY
                        </Button>
                        <Button
                          onClick={handleApproveQuestion}
                          variant="success"
                          size="md"
                          className="min-w-[140px]"
                          disabled={reviewedQuestions.has(currentQuestionIndex)}
                        >
                          {reviewedQuestions.has(currentQuestionIndex) ? 'APPROVED' : 'APPROVE'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar - Question Status */}
                <div className="space-y-3">
                  {/* Number of Questions */}
                  <div className="bg-white border-[2px] border-[#ffb554] rounded-[8px] p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-quicksand font-semibold text-[#473025] text-[12px]">
                        Number of Questions:
                      </span>
                      <span className="font-quicksand font-bold text-[#473025] text-[18px]">
                        {questions.length}
                      </span>
                    </div>
                  </div>

                  {/* Confirmed Questions */}
                  <div className="bg-white border-[2px] border-[#ffb554] rounded-[8px] p-3">
                    <h4 className="font-quicksand font-bold text-[#473025] text-[12px] mb-2">
                      Confirmed:
                    </h4>
                    {confirmedIndices.length > 0 ? (
                      <List<QuestionButtonProps>
                        defaultHeight={80}
                        rowCount={confirmedIndices.length}
                        rowHeight={40}
                        rowProps={{
                          indices: confirmedIndices,
                          currentQuestionIndex,
                          setCurrentQuestionIndex,
                          type: "confirmed"
                        }}
                        rowComponent={QuestionNumberButton}
                      />
                    ) : (
                      <span className="font-quicksand text-[#a7613c] text-[11px]">
                        No questions confirmed yet
                      </span>
                    )}
                  </div>

                  {/* Under Review Questions */}
                  <div className="bg-white border-[2px] border-[#ffb554] rounded-[8px] p-3">
                    <h4 className="font-quicksand font-bold text-[#473025] text-[12px] mb-2">
                      Under Review:
                    </h4>
                    {underReviewIndices.length > 0 ? (
                    <List<QuestionButtonProps>
                      defaultHeight={120}
                      rowCount={underReviewIndices.length}
                      rowHeight={40}
                      rowProps={{
                        indices: underReviewIndices,
                        currentQuestionIndex,
                        setCurrentQuestionIndex,
                        type: "under-review"
                      }}
                      rowComponent={QuestionNumberButton}
                    />
                    ) : (
                      <span className="font-quicksand text-[#a7613c] text-[11px]">
                        All questions reviewed!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setCurrentStep(3)}
                  variant="primary"
                  size="md"
                  className="min-w-[200px]"
                >
                  Continue to Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Launch Game */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <div className="max-w-[600px] mx-auto">
                <h2 className="font-quicksand font-bold text-[#473025] text-[20px] text-center mb-6">
                  Game Privacy Settings
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* Private Option */}
                  <div
                    onClick={() => setIsPublic(false)}
                    className={`cursor-pointer rounded-[8px] border-[3px] p-5 transition-all ${
                      !isPublic
                        ? 'border-[#96b902] bg-[#96b902]/5'
                        : 'border-[#d1c5b8] bg-white hover:border-[#ff9f22]'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-[28px] h-[28px] rounded-full border-[3px] flex items-center justify-center transition-all mb-3 ${
                        !isPublic ? 'border-[#96b902] bg-white' : 'border-[#a7613c] bg-white'
                      }`}>
                        {!isPublic && (
                          <div className="w-[12px] h-[12px] rounded-full bg-[#96b902]"></div>
                        )}
                      </div>
                      <h3 className="font-quicksand font-bold text-[#473025] text-[16px] mb-2">
                        Private
                      </h3>
                      <p className="font-quicksand text-[#a7613c] text-[12px] mb-3">
                        Only accessible to:
                      </p>
                      {!isPublic && (
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border-[2px] border-[#473025] rounded-[6px] px-3 py-2 font-quicksand font-semibold text-[#473025] text-[12px] focus:outline-none"
                        >
                          <option value="Class 1">Class 1</option>
                          <option value="Class 2">Class 2</option>
                          <option value="Class 3">Class 3</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Public Option */}
                  <div
                    onClick={() => setIsPublic(true)}
                    className={`cursor-pointer rounded-[8px] border-[3px] p-5 transition-all ${
                      isPublic
                        ? 'border-[#96b902] bg-[#96b902]/5'
                        : 'border-[#d1c5b8] bg-white hover:border-[#ff9f22]'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-[28px] h-[28px] rounded-full border-[3px] flex items-center justify-center transition-all mb-3 ${
                        isPublic ? 'border-[#96b902] bg-white' : 'border-[#a7613c] bg-white'
                      }`}>
                        {isPublic && (
                          <div className="w-[12px] h-[12px] rounded-full bg-[#96b902]"></div>
                        )}
                      </div>
                      <h3 className="font-quicksand font-bold text-[#473025] text-[16px] mb-2">
                        Public
                      </h3>
                      <p className="font-quicksand text-[#a7613c] text-[12px] mb-1">
                        Available for anyone to play!
                      </p>
                      <p className="font-quicksand text-[#a7613c] text-[10px] italic">
                        (Game will appear in the "Discover" tab)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Publish Button */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={handlePublish}
                    disabled={isSaving || !title.trim()}
                    variant="success"
                    size="lg"
                    isLoading={isSaving}
                    className="min-w-[200px]"
                  >
                    {isSaving ? 'Publishing...' : 'PUBLISH GAME'}
                  </Button>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="font-quicksand text-[#473025] text-[14px] underline hover:text-[#ff9f22] transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GameSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">Loading...</div>
      </div>
    }>
      <TeacherPageLayout>
        <GameSettingsContent />
      </TeacherPageLayout>
    </Suspense>
  );
}
