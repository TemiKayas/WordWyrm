'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateGame, getGameQuizzes, addQuizToGame, removeQuizFromGame } from '@/app/actions/game';
import { getQuizById, updateQuizQuestions, getTeacherQuizzes } from '@/app/actions/quiz';
import Button from '@/components/ui/Button';
import Navbar from '@/components/shared/Navbar';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

interface AttachedPDF {
  id: string;
  quizId: string;
  pdfFilename: string;
  uploadedAt: string;
  numQuestions: number;
}

interface AvailableQuiz {
  id: string;
  title: string;
  pdfFilename: string;
  numQuestions: number;
}

function GameEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  // Game info state
  const [gameId, setGameId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // PDF management state
  const [attachedPDFs, setAttachedPDFs] = useState<AttachedPDF[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<AvailableQuiz[]>([]);
  const [showAddPDFModal, setShowAddPDFModal] = useState(false);

  // Quiz questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!quizId) {
      router.push('/teacher/dashboard');
      return;
    }

    async function loadGameData() {
      if (!quizId) return;

      const result = await getQuizById(quizId);
      if (result.success) {
        const quiz = result.data.quiz;
        const quizData = typeof quiz.quizJson === 'string'
          ? JSON.parse(quiz.quizJson)
          : quiz.quizJson as unknown as Quiz;

        setTitle(quiz.title || 'Untitled Game');
        setQuestions(quizData.questions);

        // If there's a game associated, load game info
        if (quiz.games && quiz.games.length > 0) {
          const game = quiz.games[0];
          setGameId(game.id);
          setTitle(game.title);
          setDescription(game.description || '');
          setIsPublic(game.active);

          // Load attached PDFs
          await loadAttachedPDFs(game.id);
        }
      }
      setIsLoading(false);
    }

    loadGameData();
  }, [quizId, router]);

  const loadAttachedPDFs = async (gId: string) => {
    const result = await getGameQuizzes(gId);
    if (result.success) {
      const pdfs = result.data.quizzes.map(gq => ({
        id: gq.id,
        quizId: gq.quiz.id,
        pdfFilename: gq.quiz.processedContent.pdf.filename,
        uploadedAt: new Date(gq.quiz.processedContent.pdf.uploadedAt).toISOString(),
        numQuestions: gq.quiz.numQuestions,
      }));
      setAttachedPDFs(pdfs);
    }
  };

  const loadAvailableQuizzes = async () => {
    const result = await getTeacherQuizzes();
    if (result.success) {
      const quizzes = result.data.quizzes
        .filter(q => !attachedPDFs.some(p => p.quizId === q.id))
        .map(q => ({
          id: q.id,
          title: q.title || 'Untitled',
          pdfFilename: q.pdfFilename || 'unknown.pdf',
          numQuestions: q.numQuestions,
        }));
      setAvailableQuizzes(quizzes);
    }
  };

  const handleSaveGameInfo = async () => {
    if (!gameId || !title.trim()) {
      setSaveMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateGame({
        gameId,
        title,
        description,
        active: isPublic,
      });

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Game updated successfully! Redirecting...' });
        // Redirect back to dashboard to see updated game
        setTimeout(() => {
          router.push('/teacher/dashboard');
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving game info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save game info' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!quizId || questions.length === 0) {
      setSaveMessage({ type: 'error', text: 'At least one question is required' });
      return;
    }

    setIsSaving(true);
    try {
      const quizData: Quiz = { questions };
      const result = await updateQuizQuestions(quizId, quizData);

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Questions saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save questions' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePDF = async (quizIdToRemove: string) => {
    if (attachedPDFs.length === 1) {
      setSaveMessage({ type: 'error', text: 'Cannot remove the only PDF from a game' });
      return;
    }

    if (!confirm('Remove this PDF from the game? Questions from this PDF will no longer appear in the game.')) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await removeQuizFromGame({ gameId, quizId: quizIdToRemove });
      if (result.success) {
        setAttachedPDFs(attachedPDFs.filter(p => p.quizId !== quizIdToRemove));
        setSaveMessage({ type: 'success', text: 'PDF removed successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error removing PDF:', error);
      setSaveMessage({ type: 'error', text: 'Failed to remove PDF' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPDF = async (quizIdToAdd: string) => {
    setIsSaving(true);
    try {
      const result = await addQuizToGame({ gameId, quizId: quizIdToAdd });
      if (result.success) {
        await loadAttachedPDFs(gameId);
        setShowAddPDFModal(false);
        setSaveMessage({ type: 'success', text: 'PDF added successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error adding PDF:', error);
      setSaveMessage({ type: 'error', text: 'Failed to add PDF' });
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[48px] mb-2 leading-tight">
                Edit Your Game
              </h1>
              <p className="font-quicksand text-[#a7613c] text-[14px] md:text-[16px] max-w-[600px]">
                Customize your game settings, manage content, and perfect your quiz questions
              </p>
            </div>

            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="w-full md:w-auto bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[11px] h-[45px] md:h-[50px] px-6 flex items-center justify-center gap-2 hover:bg-[#e6832b] transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-quicksand font-bold text-white text-[16px] md:text-[18px]">
                Back to Dashboard
              </span>
            </button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`p-4 rounded-[11px] border-[3px] animate-slide-up ${
                saveMessage.type === 'success'
                  ? 'bg-[#96b902]/10 border-[#96b902] text-[#7a9700]'
                  : 'bg-red-50 border-error text-error'
              }`}
            >
              <p className="font-quicksand font-bold text-[14px]">{saveMessage.text}</p>
            </div>
          )}
        </div>

        {/* Main Content - Single Column Flow */}
        <div className="space-y-8">
          {/* Game Settings Card */}
          <div className="bg-white border-[4px] border-[#473025] rounded-[24px] p-6 md:p-8 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[48px] h-[48px] bg-[#ff9f22] rounded-[12px] flex items-center justify-center flex-shrink-0">
                <span className="text-[28px]">⚙️</span>
              </div>
              <div>
                <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] leading-tight">
                  Game Settings
                </h2>
                <p className="font-quicksand text-[#a7613c] text-[12px] md:text-[14px]">
                  Configure your game details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                        🌐 Public (Active)
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
                        🔒 Private (Inactive)
                      </div>
                      <div className="font-quicksand text-[#473025]/70 text-[12px]">
                        Game is hidden from students
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSaveGameInfo}
                disabled={isSaving || !title.trim()}
                variant="success"
                size="lg"
                className="w-full md:w-auto md:min-w-[200px]"
                isLoading={isSaving}
              >
                Save Game Settings
              </Button>
            </div>
          </div>

          {/* PDFs Section */}
          <div className="bg-white border-[4px] border-[#473025] rounded-[24px] p-6 md:p-8 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[48px] h-[48px] bg-[#ff9f22] rounded-[12px] flex items-center justify-center flex-shrink-0">
                <span className="text-[28px]">📚</span>
              </div>
              <div className="flex-1">
                <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] leading-tight">
                  Study Materials
                  <span className="ml-2 text-[#ff9f22] text-[20px]">({attachedPDFs.length})</span>
                </h2>
                <p className="font-quicksand text-[#a7613c] text-[12px] md:text-[14px]">
                  PDFs used to generate quiz questions
                </p>
              </div>
              <Button
                onClick={() => {
                  loadAvailableQuizzes();
                  setShowAddPDFModal(true);
                }}
                variant="success"
                size="md"
                className="hidden md:flex"
              >
                + Add PDF
              </Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {attachedPDFs.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-4 bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] hover:border-[#ff9f22] hover:shadow-md transition-all group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-[48px] h-[48px] bg-[#ff9f22] rounded-[11px] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-[24px]">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-quicksand font-bold text-[#473025] text-[14px] md:text-[16px] truncate">
                        {pdf.pdfFilename}
                      </p>
                      <p className="font-quicksand text-[#a7613c] text-[11px] md:text-[12px]">
                        {pdf.numQuestions} questions • {new Date(pdf.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePDF(pdf.quizId)}
                    disabled={attachedPDFs.length === 1 || isSaving}
                    className={`font-quicksand font-bold text-[12px] md:text-[13px] px-3 py-2 rounded-[8px] transition-all flex-shrink-0 ml-2 ${
                      attachedPDFs.length === 1 || isSaving
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#ff4880] hover:bg-[#ff4880] hover:text-white'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {attachedPDFs.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="w-[80px] h-[80px] bg-[#fff6e8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[40px]">📁</span>
                  </div>
                  <p className="text-[#a7613c] font-quicksand font-semibold text-[14px] mb-2">
                    No PDFs attached yet
                  </p>
                  <p className="text-[#be9f91] font-quicksand text-[12px]">
                    Add PDFs to generate quiz content
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                loadAvailableQuizzes();
                setShowAddPDFModal(true);
              }}
              variant="success"
              size="md"
              className="w-full md:hidden mt-4"
            >
              + Add PDF
            </Button>
          </div>

          {/* Quiz Questions */}
          <div className="bg-white border-[4px] border-[#473025] rounded-[24px] p-6 md:p-8 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[48px] h-[48px] bg-[#ff9f22] rounded-[12px] flex items-center justify-center flex-shrink-0">
                <span className="text-[28px]">❓</span>
              </div>
              <div className="flex-1">
                <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] leading-tight">
                  Quiz Questions
                  <span className="ml-2 text-[#ff9f22] text-[20px]">({questions.length})</span>
                </h2>
                <p className="font-quicksand text-[#a7613c] text-[12px] md:text-[14px]">
                  Edit and manage your quiz questions
                </p>
              </div>
              <Button
                onClick={handleAddQuestion}
                variant="success"
                size="md"
                className="hidden md:flex"
              >
                + Add Question
              </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto pr-2">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`border-[3px] rounded-[11px] p-4 transition-all ${
                    editingQuestionIndex === index
                      ? 'border-[#ff9f22] bg-[#fff5e8] shadow-md'
                      : 'border-[#ffb554] bg-[#fff6e8] hover:border-[#ff9f22] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-[28px] h-[28px] bg-[#ff9f22] rounded-full flex items-center justify-center text-white font-quicksand font-bold text-[13px]">
                        {index + 1}
                      </span>
                      <span className="font-quicksand font-bold text-[#473025] text-[15px]">
                        Question {index + 1}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingQuestionIndex(editingQuestionIndex === index ? null : index)}
                        className="text-[#ff9f22] hover:text-[#e6832b] font-quicksand font-bold text-[12px] px-3 py-1 rounded-[8px] hover:bg-[#ff9f22]/10 transition-all"
                      >
                        {editingQuestionIndex === index ? '▲ Close' : '▼ Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="text-[#ff4880] hover:text-white hover:bg-[#ff4880] font-quicksand font-bold text-[12px] px-3 py-1 rounded-[8px] transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingQuestionIndex === index ? (
                    <div className="space-y-4">
                      {/* Question Text */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[13px] mb-2 block">
                          Question Text
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                          className="w-full bg-white border-[3px] border-[#ffb554] rounded-[11px] p-3 font-quicksand text-[#473025] text-[14px] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] resize-none transition-all"
                          rows={3}
                        />
                      </div>

                      {/* Options */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[13px] mb-2 block">
                          Answer Options
                        </label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-3">
                              <div className="w-[32px] h-[32px] bg-[#ff9f22] rounded-[8px] flex items-center justify-center flex-shrink-0">
                                <span className="font-quicksand font-bold text-white text-[14px]">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                className="flex-1 bg-white border-[3px] border-[#ffb554] rounded-[11px] px-4 py-2 font-quicksand text-[#473025] text-[14px] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] transition-all"
                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Correct Answer */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[13px] mb-2 block">
                          ✓ Correct Answer
                        </label>
                        <select
                          value={question.answer}
                          onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                          className="w-full bg-white border-[3px] border-[#96b902] rounded-[11px] px-4 py-3 font-quicksand font-bold text-[#473025] text-[14px] focus:outline-none focus:ring-4 focus:ring-[#96b902]/30 transition-all"
                        >
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Explanation (Optional) */}
                      <div>
                        <label className="font-quicksand font-bold text-[#473025] text-[13px] mb-2 block">
                          Explanation
                          <span className="font-normal text-[#a7613c] text-[11px] ml-2">(Optional)</span>
                        </label>
                        <textarea
                          value={question.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                          placeholder="Help students understand why this is correct..."
                          className="w-full bg-white border-[3px] border-[#ffb554] rounded-[11px] p-3 font-quicksand text-[#473025] text-[14px] placeholder:text-[#be9f91] focus:outline-none focus:ring-4 focus:ring-[#ff9f22]/30 focus:border-[#ff9f22] resize-none transition-all"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#473025] font-quicksand text-[13px] line-clamp-2">
                      {question.question}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddQuestion}
              variant="success"
              size="md"
              className="w-full md:hidden mb-4"
            >
              + Add Question
            </Button>

            {/* Save Questions Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveQuestions}
                disabled={isSaving || questions.length === 0}
                variant="success"
                size="lg"
                className="w-full md:w-auto md:min-w-[200px]"
                isLoading={isSaving}
              >
                Save All Questions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add PDF Modal */}
      {showAddPDFModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] border-[4px] border-[#473025] p-6 md:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[48px] h-[48px] bg-[#ff9f22] rounded-[12px] flex items-center justify-center">
                <span className="text-[28px]">📄</span>
              </div>
              <h3 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px]">
                Add Study Material
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {availableQuizzes.map((quiz, index) => (
                <button
                  key={quiz.id}
                  onClick={() => handleAddPDF(quiz.id)}
                  disabled={isSaving}
                  className={`w-full text-left p-4 bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] transition-all ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#ff9f22] hover:shadow-md hover:scale-[1.02]'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <p className="font-quicksand font-bold text-[#473025] text-[15px] mb-1">
                    {quiz.title}
                  </p>
                  <p className="font-quicksand text-[#a7613c] text-[12px]">
                    {quiz.pdfFilename} • {quiz.numQuestions} questions
                  </p>
                </button>
              ))}

              {availableQuizzes.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-[80px] h-[80px] bg-[#fff6e8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[40px]">📭</span>
                  </div>
                  <p className="text-[#a7613c] font-quicksand font-semibold text-[14px] mb-2">
                    No PDFs Available
                  </p>
                  <p className="text-[#be9f91] font-quicksand text-[12px] max-w-[300px] mx-auto">
                    All your quizzes are already attached or you need to upload new PDFs from the dashboard.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowAddPDFModal(false)}
              disabled={isSaving}
              variant="outline"
              size="md"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">Loading...</div>
      </div>
    }>
      <GameEditContent />
    </Suspense>
  );
}
