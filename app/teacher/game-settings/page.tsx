'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createGame } from '@/app/actions/game';
import { getQuizById, updateQuizQuestions } from '@/app/actions/quiz';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import { GameMode } from '@prisma/client';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

function GameSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  // Game settings state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TRADITIONAL);

  // Quiz questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

        setTitle(quiz.title || 'Untitled Game');
        setQuestions(quizData.questions);
        // Access PDF filename through the included relations
        const pdfFilename = (quiz as {processedContent?: {pdf?: {filename?: string}}}).processedContent?.pdf?.filename || 'Unknown PDF';
        setPdfFilename(pdfFilename);
      }
      setIsLoading(false);
    }

    loadQuizData();
  }, [quizId, router]);

  const handleUpdateQuestion = (index: number, field: keyof QuizQuestion, value: string | string[]) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    setQuestions(newQuestions);
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = value;
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newOptions,
    };
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length === 1) {
      setSaveMessage({ type: 'error', text: 'You must have at least one question' });
      return;
    }

    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter((_, i) => i !== index));
      setEditingQuestionIndex(null);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      explanation: '',
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestionIndex(questions.length);
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
      });

      if (result.success) {
        setSaveMessage({ type: 'success', text: isPublic ? 'Game published successfully! Redirecting...' : 'Game saved as draft! Redirecting...' });
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

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Header Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="flex-1">
              <h1 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[32px] leading-tight">
                Review & Publish Game
              </h1>
              <p className="font-quicksand text-[#a7613c] text-[13px] md:text-[14px] max-w-[600px]">
                Review your AI-generated quiz questions, customize settings, and publish your game
              </p>
            </div>

            <BackButton href="/teacher/dashboard" variant="text">Back to Dashboard</BackButton>

          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`p-3 rounded-[8px] border-2 ${
                saveMessage.type === 'success'
                  ? 'bg-[#96b902]/10 border-[#96b902] text-[#7a9700]'
                  : 'bg-red-50 border-red-500 text-red-700'
              }`}
            >
              <p className="font-quicksand font-semibold text-[13px]">{saveMessage.text}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* PDF Info Banner */}
          <div className="bg-gradient-to-r from-[#96b902]/10 to-[#ff9f22]/10 border-[3px] border-[#96b902] rounded-[18px] p-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-[56px] h-[56px] bg-[#96b902] rounded-[12px] flex items-center justify-center flex-shrink-0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-quicksand font-bold text-[#473025] text-[18px] md:text-[20px] mb-1">
                  Quiz Generated from: {pdfFilename}
                </h3>
                <p className="font-quicksand text-[#473025] text-[13px] md:text-[14px]">
                  {questions.length} AI-generated questions ready to review
                </p>
              </div>
            </div>
          </div>

          {/* Game Settings Card */}
          <div className="bg-white border-[3px] border-[#473025] rounded-[16px] p-4 md:p-5 shadow-md animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[32px] h-[32px] bg-[#ff9f22] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-quicksand font-bold text-[#473025] text-[18px]">
                Game Settings
              </h2>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label htmlFor="title" className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] mb-2 block">
                  Game Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., World War II History Quiz"
                  className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] h-[50px] md:h-[55px] px-4 font-quicksand font-semibold text-[#473025] text-[14px] placeholder:text-[#be9f91] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] hover:border-[#ff9f22] transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label htmlFor="description" className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] mb-2 block">
                  Description
                  <span className="font-normal text-[#a7613c] text-[12px] ml-2">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell your students what this game is about..."
                  className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] h-[100px] px-4 py-3 font-quicksand text-[#473025] text-[14px] placeholder:text-[#be9f91] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] hover:border-[#ff9f22] transition-all resize-none"
                />
              </div>

              {/* Game Mode */}
              <div>
                <label htmlFor="gameMode" className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] mb-2 block">
                  Game Mode *
                </label>
                <select
                  id="gameMode"
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as GameMode)}
                  className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] h-[50px] md:h-[55px] px-4 font-quicksand font-semibold text-[#473025] text-[14px] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] hover:border-[#ff9f22] transition-all"
                >
                  <option value={GameMode.TRADITIONAL}>Traditional Quiz</option>
                  <option value={GameMode.TOWER_DEFENSE}>Tower Defense</option>
                  <option value={GameMode.SNAKE}>Snake Quiz</option>
                </select>
              </div>

              {/* Privacy Settings */}
              <div className="lg:col-span-2">
                <label className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] mb-3 block">
                  Privacy Settings
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 cursor-pointer p-4 rounded-[11px] transition-all border-[3px] ${
                      isPublic
                        ? 'bg-[#96b902]/10 border-[#96b902] shadow-md'
                        : 'bg-white border-[#ffb554] hover:border-[#ff9f22] hover:shadow-sm'
                    }`}
                    onClick={() => setIsPublic(true)}
                  >
                    <div className={`w-[24px] h-[24px] flex-shrink-0 rounded-full border-[3px] flex items-center justify-center transition-all mt-0.5 ${
                      isPublic ? 'border-[#96b902] bg-[#96b902]' : 'border-[#a7613c]'
                    }`}>
                      {isPublic && (
                        <div className="w-[10px] h-[10px] rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-quicksand font-bold text-[15px] mb-1 ${
                        isPublic ? 'text-[#96b902]' : 'text-[#473025]'
                      }`}>
                        Public (Active)
                      </div>
                      <div className="font-quicksand text-[#473025]/70 text-[12px]">
                        Students can join and play this game
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 cursor-pointer p-4 rounded-[11px] transition-all border-[3px] ${
                      !isPublic
                        ? 'bg-[#96b902]/10 border-[#96b902] shadow-md'
                        : 'bg-white border-[#ffb554] hover:border-[#ff9f22] hover:shadow-sm'
                    }`}
                    onClick={() => setIsPublic(false)}
                  >
                    <div className={`w-[24px] h-[24px] flex-shrink-0 rounded-full border-[3px] flex items-center justify-center transition-all mt-0.5 ${
                      !isPublic ? 'border-[#96b902] bg-[#96b902]' : 'border-[#a7613c]'
                    }`}>
                      {!isPublic && (
                        <div className="w-[10px] h-[10px] rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-quicksand font-bold text-[15px] mb-1 ${
                        !isPublic ? 'text-[#96b902]' : 'text-[#473025]'
                      }`}>
                        Private (Draft)
                      </div>
                      <div className="font-quicksand text-[#473025]/70 text-[12px]">
                        Save as draft - not visible to students
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Questions Card */}
          <div className="bg-white border-[3px] border-[#473025] rounded-[16px] p-4 md:p-5 shadow-md animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-quicksand font-bold text-[#473025] text-[18px]">
                  Questions ({questions.length})
                </h2>
              </div>
              <button
                onClick={handleAddQuestion}
                className="bg-[#96b902] border-[2px] border-[#006029] text-white font-quicksand font-bold text-[11px] px-2.5 py-1.5 rounded-[6px] hover:bg-[#82a002] transition-all shadow-[0_3px_0_0_#006029] hover:shadow-[0_4px_0_0_#006029] active:shadow-[0_1px_0_0_#006029] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-2 mb-3 max-h-[600px] overflow-y-auto pr-1">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-[8px] p-3 transition-all ${
                    editingQuestionIndex === index
                      ? 'border-[#ff9f22] bg-[#fff5e8]'
                      : 'border-[#ffb554] bg-[#fff6e8] hover:border-[#ff9f22]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-[22px] h-[22px] bg-[#ff9f22] rounded-full flex items-center justify-center text-white font-quicksand font-bold text-[11px]">
                        {index + 1}
                      </span>
                      <span className="font-quicksand font-bold text-[#473025] text-[13px]">
                        Q{index + 1}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setEditingQuestionIndex(editingQuestionIndex === index ? null : index)}
                        className="text-[#ff9f22] hover:text-[#e6832b] font-quicksand font-bold text-[11px] px-2 py-0.5 rounded-[6px] hover:bg-[#ff9f22]/10 transition-all"
                      >
                        {editingQuestionIndex === index ? 'Close' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="text-[#ff4880] hover:text-white hover:bg-[#ff4880] font-quicksand font-bold text-[11px] px-2 py-0.5 rounded-[6px] transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingQuestionIndex === index ? (
                    <div className="space-y-3">
                      {/* Question Text */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1.5 block">
                          Question Text
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                          className="w-full bg-white border-2 border-[#ffb554] rounded-[8px] p-2.5 font-quicksand text-[#473025] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] resize-none transition-all"
                          rows={2}
                        />
                      </div>

                      {/* Options */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1.5 block">
                          Answer Options
                        </label>
                        <div className="space-y-1.5">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <div className="w-[24px] h-[24px] bg-[#ff9f22] rounded-[6px] flex items-center justify-center flex-shrink-0">
                                <span className="font-quicksand font-bold text-white text-[11px]">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                className="flex-1 bg-white border-2 border-[#ffb554] rounded-[8px] px-2.5 py-1.5 font-quicksand text-[#473025] text-[12px] focus:outline-none focus:ring-2 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] transition-all"
                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Correct Answer */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1.5 block">
                          Correct Answer
                        </label>
                        <select
                          value={question.answer}
                          onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                          className="w-full bg-white border-2 border-[#96b902] rounded-[8px] px-2.5 py-2 font-quicksand font-bold text-[#473025] text-[12px] focus:outline-none focus:ring-2 focus:ring-[#96b902]/30 transition-all"
                        >
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1.5 block">
                          Explanation
                          <span className="font-normal text-[#a7613c] text-[10px] ml-1.5">(Optional)</span>
                        </label>
                        <textarea
                          value={question.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                          placeholder="Help students understand why this is correct..."
                          className="w-full bg-white border-2 border-[#ffb554] rounded-[8px] p-2.5 font-quicksand text-[#473025] text-[12px] placeholder:text-[#be9f91] focus:outline-none focus:ring-2 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] resize-none transition-all"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#473025] font-quicksand text-[12px] line-clamp-2">
                      {question.question}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* Publish Section */}
          <div className="mt-6 bg-white border-[3px] border-[#96b902] rounded-[16px] p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-1">
                Ready to {isPublic ? 'Publish' : 'Save'}?
              </h3>
              <p className="font-quicksand text-[#473025]/70 text-[14px]">
                All questions and settings will be saved when you {isPublic ? 'publish' : 'save as draft'}.
              </p>
            </div>
            <Button
              onClick={handlePublish}
              disabled={isSaving || !title.trim() || questions.length === 0}
              variant="success"
              size="lg"
              isLoading={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? 'Publishing...' : (isPublic ? 'Publish Game' : 'Save as Draft')}
            </Button>
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
