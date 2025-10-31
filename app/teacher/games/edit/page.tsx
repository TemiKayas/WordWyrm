'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { updateGame } from '@/app/actions/game';
import { getQuizById, updateQuizQuestions } from '@/app/actions/quiz';
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

function GameEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get('quizId');

  // Game info state
  const [gameId, setGameId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

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
        }
      }
      setIsLoading(false);
    }

    loadGameData();
  }, [quizId, router]);

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
        setSaveMessage({ type: 'success', text: 'Game info saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
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

      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="flex items-center gap-2 text-[#473025] hover:text-[#ff9f22] transition-colors mb-4"
          >
            <span className="text-xl">←</span>
            <span className="font-quicksand font-semibold">Back to Dashboard</span>
          </button>

          <h1 className="font-quicksand font-bold text-[#473025] text-[42px]">
            Edit Game
          </h1>
          <p className="font-quicksand text-[#be9f91] text-[18px]">
            Update your game settings and quiz questions
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 ${
              saveMessage.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'bg-red-50 border-red-500 text-red-700'
            }`}
          >
            <p className="font-quicksand font-semibold">{saveMessage.text}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Game Info */}
          <div className="bg-white border-[3px] border-[#473025] rounded-[18px] p-6 h-fit">
            <h2 className="font-quicksand font-bold text-[#473025] text-[28px] mb-6">
              Game Settings
            </h2>

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="font-quicksand font-bold text-[#473025] text-[16px] mb-2 block">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter game title..."
                className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] h-[50px] px-4 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="font-quicksand font-bold text-[#473025] text-[16px] mb-2 block">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your game..."
                className="w-full bg-[#fff6e8] border-[3px] border-[#ffb554] rounded-[11px] h-[122px] px-4 py-3 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all resize-none"
              />
            </div>

            {/* Privacy Settings */}
            <div className="mb-6">
              <label className="font-quicksand font-bold text-[#473025] text-[16px] mb-3 block">
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
                      Public (Active)
                    </div>
                    <div className="font-quicksand font-medium text-[#473025]/70 text-[11px]">
                      Students can join and play this game
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
                  <div>
                    <div className={`font-quicksand font-bold text-[14px] ${
                      !isPublic ? 'text-[#96b902]' : 'text-[#473025]'
                    }`}>
                      Private (Inactive)
                    </div>
                    <div className="font-quicksand font-medium text-[#473025]/70 text-[11px]">
                      Game is hidden from students
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveGameInfo}
              disabled={isSaving || !title.trim()}
              variant="success"
              size="md"
              className="w-full"
              isLoading={isSaving}
            >
              Save Game Settings
            </Button>
          </div>

          {/* Right Side - Quiz Questions */}
          <div className="bg-white border-[3px] border-[#473025] rounded-[18px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-quicksand font-bold text-[#473025] text-[28px]">
                Quiz Questions ({questions.length})
              </h2>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-2 bg-[#96b902] hover:bg-[#7a9602] text-white font-quicksand font-bold px-4 py-2 rounded-[11px] transition-all"
              >
                <span className="text-xl">+</span>
                <span>Add Question</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto pr-2">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`border-[2px] rounded-[11px] p-4 transition-all ${
                    editingQuestionIndex === index
                      ? 'border-[#ff9f22] bg-[#fff5e8]'
                      : 'border-[#ffb554] bg-[#fff6e8] hover:border-[#ff9f22]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-quicksand font-bold text-[#473025] text-[16px]">
                      Question {index + 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingQuestionIndex(editingQuestionIndex === index ? null : index)}
                        className="text-[#ff9f22] hover:text-[#e6832b] font-quicksand font-semibold text-[14px]"
                      >
                        {editingQuestionIndex === index ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(index)}
                        className="text-[#ff4880] hover:text-[#e03d6f] font-quicksand font-semibold text-[14px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingQuestionIndex === index ? (
                    <div className="space-y-3">
                      {/* Question Text */}
                      <div>
                        <label className="font-quicksand font-semibold text-[#473025] text-[14px] mb-1 block">
                          Question
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                          className="w-full bg-white border-[2px] border-[#ffb554] rounded-[8px] p-3 font-quicksand text-[#473025] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Options */}
                      <div>
                        <label className="font-quicksand font-semibold text-[#473025] text-[14px] mb-2 block">
                          Options
                        </label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <span className="font-quicksand font-bold text-[#473025] text-[14px] w-[24px]">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                className="flex-1 bg-white border-[2px] border-[#ffb554] rounded-[8px] px-3 py-2 font-quicksand text-[#473025] focus:outline-none focus:ring-2 focus:ring-[#ff9f22]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Correct Answer */}
                      <div>
                        <label className="font-quicksand font-semibold text-[#473025] text-[14px] mb-1 block">
                          Correct Answer
                        </label>
                        <select
                          value={question.answer}
                          onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                          className="w-full bg-white border-[2px] border-[#ffb554] rounded-[8px] px-3 py-2 font-quicksand text-[#473025] focus:outline-none focus:ring-2 focus:ring-[#ff9f22]"
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
                        <label className="font-quicksand font-semibold text-[#473025] text-[14px] mb-1 block">
                          Explanation (Optional)
                        </label>
                        <textarea
                          value={question.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                          placeholder="Explain why this is the correct answer..."
                          className="w-full bg-white border-[2px] border-[#ffb554] rounded-[8px] p-3 font-quicksand text-[#473025] placeholder:text-[#a7613c]/50 focus:outline-none focus:ring-2 focus:ring-[#ff9f22] resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#473025]/70 font-quicksand text-[14px]">
                      {question.question.substring(0, 100)}
                      {question.question.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save Questions Button */}
            <Button
              onClick={handleSaveQuestions}
              disabled={isSaving || questions.length === 0}
              variant="success"
              size="md"
              className="w-full"
              isLoading={isSaving}
            >
              Save All Questions
            </Button>
          </div>
        </div>
      </div>
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
