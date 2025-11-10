'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateGame, getGameQuizzes, addQuizToGame, removeQuizFromGame } from '@/app/actions/game';
import { getQuizById, updateQuizQuestions, getTeacherQuizzes } from '@/app/actions/quiz';
import { getQuizSourcePDFs, removePDFFromQuiz, addPDFsToQuiz, regenerateQuizQuestions } from '@/app/actions/pdf';
import Button from '@/components/ui/Button';
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

interface SourcePDF {
    id: string;
    filename: string;
    fileSize: number;
    uploadedAt: Date;
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

    const [gameId, setGameId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.TRADITIONAL);
    const [coverImage, setCoverImage] = useState<string>('');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    const [sourcePDFs, setSourcePDFs] = useState<SourcePDF[]>([]);
    const [showUploadPDFModal, setShowUploadPDFModal] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

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
                const quizData = typeof quiz.quizJson === 'string' ? JSON.parse(quiz.quizJson) : (quiz.quizJson as unknown as Quiz);
                setTitle(quiz.title || 'Untitled Game');
                setQuestions(quizData.questions || []);
                if (quiz.games && quiz.games.length > 0) {
                    const game = quiz.games[0];
                    setGameId(game.id);
                    setTitle(game.title);
                    setDescription(game.description || '');
                    setIsActive(game.active);
                    setIsPublic(game.isPublic);
                    setGameMode(game.gameMode);
                }
                // Load source PDFs
                await loadSourcePDFs(quizId);
            }
            setIsLoading(false);
        }
        loadGameData();
    }, [quizId, router]);

    const loadSourcePDFs = async (qId: string) => {
        const result = await getQuizSourcePDFs(qId);
        if (result.success) {
            setSourcePDFs(result.data.pdfs);
        }
    };

    const handleUploadMorePDFs = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !quizId) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('pdfs', file);
            });
            formData.append('numQuestions', '5'); // Default 5 questions per new PDF

            const result = await addPDFsToQuiz({ quizId, formData });

            if (result.success) {
                setSaveMessage({ type: 'success', text: `Added ${result.data.addedQuestions} new questions!` });
                // Reload data
                await loadSourcePDFs(quizId);
                const quizResult = await getQuizById(quizId);
                if (quizResult.success) {
                    const quizData = typeof quizResult.data.quiz.quizJson === 'string'
                        ? JSON.parse(quizResult.data.quiz.quizJson)
                        : (quizResult.data.quiz.quizJson as unknown as Quiz);
                    setQuestions(quizData.questions || []);
                }
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ type: 'error', text: result.error });
            }
        } catch {
            setSaveMessage({ type: 'error', text: 'Failed to upload PDFs' });
        } finally {
            setIsSaving(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRegenerateQuestions = async () => {
        if (!quizId || !confirm('Regenerate all questions? This will replace existing questions.')) {
            return;
        }

        setIsRegenerating(true);
        setIsSaving(true);
        try {
            const result = await regenerateQuizQuestions({ quizId, numQuestions: questions.length });

            if (result.success) {
                setSaveMessage({ type: 'success', text: `Regenerated ${result.data.numQuestions} questions!` });
                // Reload questions
                const quizResult = await getQuizById(quizId);
                if (quizResult.success) {
                    const quizData = typeof quizResult.data.quiz.quizJson === 'string'
                        ? JSON.parse(quizResult.data.quiz.quizJson)
                        : (quizResult.data.quiz.quizJson as unknown as Quiz);
                    setQuestions(quizData.questions || []);
                }
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ type: 'error', text: result.error });
            }
        } catch {
            setSaveMessage({ type: 'error', text: 'Failed to regenerate questions' });
        } finally {
            setIsRegenerating(false);
            setIsSaving(false);
        }
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAll = async () => {
        if (!quizId || questions.length === 0 || !title.trim()) {
            setSaveMessage({
                type: 'error',
                text: !title.trim()
                    ? 'Title is required'
                    : 'At least one question is required'
            });
            return;
        }
        setIsSaving(true);
        try {
            const results: string[] = [];

            const qRes = await updateQuizQuestions(quizId, { questions });
            if (qRes.success) {
                results.push('Questions saved');
            }

            if (gameId) {
                const gRes = await updateGame({
                    gameId,
                    title,
                    description,
                    active: isActive,
                    isPublic: isPublic,
                    gameMode: gameMode,
                });
                if (gRes.success) {
                    results.push('Game updated');
                }
            }

            setSaveMessage({ type: 'success', text: `${results.join(' & ')}! Redirecting...` });
            setTimeout(() => {
                router.push('/teacher/dashboard');
            }, 1500);
        } catch (e) {
            setSaveMessage({ type: 'error', text: (e as Error)?.message || 'Save failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveSourcePDF = async (pdfId: string) => {
        if (sourcePDFs.length === 1) {
            setSaveMessage({ type: 'error', text: 'Cannot remove the only PDF from a quiz' });
            return;
        }
        if (!quizId || !confirm('Remove this PDF? The questions will remain but can no longer be regenerated from this PDF.')) {
            return;
        }
        setIsSaving(true);
        try {
            const result = await removePDFFromQuiz({ quizId, pdfId });
            if (result.success) {
                setSourcePDFs(sourcePDFs.filter(p => p.id !== pdfId));
                setSaveMessage({ type: 'success', text: 'PDF removed from sources!' });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                setSaveMessage({ type: 'error', text: result.error });
            }
        } catch {
            setSaveMessage({ type: 'error', text: 'Failed to remove PDF' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateQuestion = (index: number, field: keyof QuizQuestion, value: string | string[]) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value } as QuizQuestion;
        setQuestions(newQuestions);
    };

    const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[questionIndex].options];
        newOptions[optionIndex] = value;
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-4 md:py-6">
                <div className="mb-4 md:mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div className="flex-1">
                            <h1 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[32px] leading-tight">Edit Game</h1>
                            <p className="font-quicksand text-[#a7613c] text-[13px] md:text-[14px] max-w-[600px]">Customize settings, content, and questions</p>
                        </div>
                        <button
                            onClick={() => router.push('/teacher/dashboard')}
                            className="w-full md:w-auto bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[8px] h-[38px] px-4 flex items-center justify-center gap-2 hover:bg-[#e6832b] transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-quicksand font-bold text-white text-[14px]">Back</span>
                        </button>
                    </div>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white border-[3px] border-[#473025] rounded-[16px] p-4 md:p-5 shadow-md">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-[32px] h-[32px] bg-[#ff9f22] rounded-[8px] flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="white"/>
                                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h2 className="font-quicksand font-bold text-[#473025] text-[18px]">Game Settings</h2>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="font-quicksand font-semibold text-[#473025] text-[12px] mb-1.5 block">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-[#fff6e8] border-2 border-[#ffb554] rounded-[8px] h-[36px] px-3 font-quicksand text-[#473025] text-[13px] focus:outline-none focus:border-[#ff9f22] transition-all"
                                        placeholder="Game title..."
                                    />
                                </div>
                                <div>
                                    <label className="font-quicksand font-semibold text-[#473025] text-[12px] mb-1.5 block">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-[#fff6e8] border-2 border-[#ffb554] rounded-[8px] h-[60px] px-3 py-2 font-quicksand text-[#473025] text-[13px] focus:outline-none focus:border-[#ff9f22] transition-all resize-none"
                                        placeholder="Game description..."
                                    />
                                </div>
                                <div>
                                    <label className="font-quicksand font-semibold text-[#473025] text-[12px] mb-1.5 block">Game Mode</label>
                                    <select
                                        value={gameMode}
                                        onChange={(e) => setGameMode(e.target.value as GameMode)}
                                        className="w-full bg-[#fff6e8] border-2 border-[#ffb554] rounded-[8px] h-[36px] px-3 font-quicksand text-[#473025] text-[13px] focus:outline-none focus:border-[#ff9f22] transition-all"
                                    >
                                        <option value={GameMode.TRADITIONAL}>Traditional Quiz</option>
                                        <option value={GameMode.TOWER_DEFENSE}>Tower Defense</option>
                                        <option value={GameMode.SNAKE}>Snake Quiz</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-quicksand font-semibold text-[#473025] text-[12px] block">Active</span>
                                            <span className="font-quicksand text-[#a7613c] text-[10px]">Game is {isActive ? 'active' : 'draft'}</span>
                                        </div>
                                        <button
                                            onClick={() => setIsActive(!isActive)}
                                            className={`relative inline-flex h-[28px] w-[52px] items-center rounded-full transition-colors ${
                                                isActive ? 'bg-[#96b902]' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white transition-transform ${
                                                    isActive ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-quicksand font-semibold text-[#473025] text-[12px] block">Public Discovery</span>
                                            <span className="font-quicksand text-[#a7613c] text-[10px]">{isPublic ? 'Visible in discovery' : 'Class only'}</span>
                                        </div>
                                        <button
                                            onClick={() => setIsPublic(!isPublic)}
                                            className={`relative inline-flex h-[28px] w-[52px] items-center rounded-full transition-colors ${
                                                isPublic ? 'bg-[#96b902]' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white transition-transform ${
                                                    isPublic ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-quicksand font-semibold text-[#473025] text-[12px] mb-1.5 block">Cover Image</label>
                                    {coverImage && (
                                        <div className="mb-2">
                                            <img src={coverImage} alt="Cover" className="w-full h-[80px] object-cover rounded-[8px] border-2 border-[#ffb554]" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverImageChange}
                                        className="hidden"
                                        id="cover-upload"
                                    />
                                    <label
                                        htmlFor="cover-upload"
                                        className="inline-flex items-center gap-2 cursor-pointer bg-[#fff6e8] border-2 border-[#ffb554] hover:border-[#ff9f22] text-[#473025] font-quicksand font-semibold text-[12px] px-3 py-2 rounded-[8px] transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Upload Image
                                    </label>
                                </div>
                                {!gameId && <p className="text-[11px] font-quicksand text-[#a7613c] text-center">This quiz is not linked to a game yet.</p>}
                            </div>
                        </div>

                        <div className="bg-white border-[3px] border-[#473025] rounded-[16px] p-4 md:p-5 shadow-md">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-[32px] h-[32px] bg-[#ff9f22] rounded-[8px] flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="white"/>
                                        <polyline points="14,2 14,8 20,8" fill="white"/>
                                        <line x1="16" y1="13" x2="8" y2="13" stroke="#ff9f22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="16" y1="17" x2="8" y2="17" stroke="#ff9f22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="10,9 9,9 8,9" stroke="#ff9f22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h2 className="font-quicksand font-bold text-[#473025] text-[18px]">Source PDFs</h2>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-quicksand text-[#a7613c] text-[11px]">
                                    {sourcePDFs.length} PDF{sourcePDFs.length !== 1 ? 's' : ''} • {questions.length} total questions
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    onChange={handleUploadMorePDFs}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSaving}
                                    className="bg-[#96b902] text-white font-quicksand font-bold text-[11px] px-2.5 py-1.5 rounded-[6px] hover:bg-[#82a002] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    + Upload More
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                {sourcePDFs.map((pdf) => (
                                    <div
                                        key={pdf.id}
                                        className="flex items-center justify-between p-3 bg-[#fff6e8] border-2 border-[#ffb554] rounded-[8px] hover:border-[#ff9f22] transition-all"
                                    >
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <div className="w-[32px] h-[32px] bg-[#ff9f22] rounded-[6px] flex items-center justify-center flex-shrink-0">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="white"/>
                                                    <polyline points="14,2 14,8 20,8" fill="white"/>
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-quicksand font-bold text-[#473025] text-[12px] truncate">{pdf.filename}</p>
                                                <p className="font-quicksand text-[#a7613c] text-[10px]">{(pdf.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveSourcePDF(pdf.id)}
                                            disabled={sourcePDFs.length === 1 || isSaving}
                                            className="font-quicksand font-bold text-[11px] text-[#ff4880] hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1 transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                {sourcePDFs.length === 0 && (
                                    <div className="text-center py-6">
                                        <div className="w-[48px] h-[48px] bg-[#fff6e8] rounded-full flex items-center justify-center mx-auto mb-2">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="#a7613c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <p className="text-[#a7613c] font-quicksand font-semibold text-[12px] mb-1">No PDFs found</p>
                                        <p className="text-[#be9f91] font-quicksand text-[10px]">Upload PDFs to generate content</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border-[3px] border-[#473025] rounded-[16px] p-4 md:p-5 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-quicksand font-bold text-[#473025] text-[18px]">Questions ({questions.length})</h2>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRegenerateQuestions}
                                        disabled={isRegenerating || isSaving || sourcePDFs.length === 0}
                                        className="bg-[#ff9f22] text-white font-quicksand font-bold text-[11px] px-2.5 py-1.5 rounded-[6px] hover:bg-[#e6832b] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isRegenerating ? 'Regenerating...' : '🔄 Regenerate'}
                                    </button>
                                    <button
                                        onClick={handleAddQuestion}
                                        className="bg-[#96b902] text-white font-quicksand font-bold text-[11px] px-2.5 py-1.5 rounded-[6px] hover:bg-[#82a002] transition-all"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
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
                                                <span className="font-quicksand font-bold text-[#473025] text-[13px]">Question {index + 1}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => setEditingQuestionIndex(editingQuestionIndex === index ? null : index)}
                                                    className="text-[#ff9f22] hover:text-[#e6832b] font-quicksand font-bold text-[10px] px-2 py-1 rounded-[4px] hover:bg-[#ff9f22]/10 transition-all"
                                                >
                                                    {editingQuestionIndex === index ? 'Close' : 'Edit'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(index)}
                                                    className="text-[#ff4880] hover:text-red-600 font-quicksand font-bold text-[10px] px-2 py-1 rounded-[4px] hover:bg-red-50 transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {editingQuestionIndex === index ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1 block">Question</label>
                                                    <textarea
                                                        value={question.question}
                                                        onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                                                        className="w-full bg-white border-2 border-[#ffb554] rounded-[6px] p-2 font-quicksand text-[#473025] text-[12px] focus:outline-none focus:border-[#ff9f22] resize-none transition-all"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1 block">Options</label>
                                                    <div className="space-y-1.5">
                                                        {question.options.map((option, optionIndex) => (
                                                            <div key={optionIndex} className="flex items-center gap-2">
                                                                <div className="w-[24px] h-[24px] bg-[#ff9f22] rounded-[4px] flex items-center justify-center flex-shrink-0">
                                                                    <span className="font-quicksand font-bold text-white text-[11px]">
                                                                        {String.fromCharCode(65 + optionIndex)}
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => handleUpdateOption(index, optionIndex, e.target.value)}
                                                                    className="flex-1 bg-white border-2 border-[#ffb554] rounded-[6px] px-2 py-1.5 font-quicksand text-[#473025] text-[12px] focus:outline-none focus:border-[#ff9f22] transition-all"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1 block">Correct Answer</label>
                                                    <select
                                                        value={question.answer}
                                                        onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                                                        className="w-full bg-white border-2 border-[#96b902] rounded-[6px] px-2 py-2 font-quicksand font-bold text-[#473025] text-[12px] focus:outline-none transition-all"
                                                    >
                                                        {question.options.map((option, optionIndex) => (
                                                            <option key={optionIndex} value={option}>
                                                                {String.fromCharCode(65 + optionIndex)}. {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="font-quicksand font-bold text-[#473025] text-[11px] mb-1 block">Explanation (optional)</label>
                                                    <textarea
                                                        value={question.explanation || ''}
                                                        onChange={(e) => handleUpdateQuestion(index, 'explanation', e.target.value)}
                                                        placeholder="Explain why this is correct..."
                                                        className="w-full bg-white border-2 border-[#ffb554] rounded-[6px] p-2 font-quicksand text-[#473025] text-[12px] placeholder:text-[#be9f91] focus:outline-none focus:border-[#ff9f22] resize-none transition-all"
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
                                {questions.length === 0 && (
                                    <div className="text-center py-8">
                                        <div className="w-[48px] h-[48px] bg-[#fff6e8] rounded-full flex items-center justify-center mx-auto mb-2">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="3" stroke="#a7613c" strokeWidth="2"/>
                                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#a7613c" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <p className="text-[#a7613c] font-quicksand font-semibold text-[12px] mb-1">No questions yet</p>
                                        <p className="text-[#be9f91] font-quicksand text-[10px]">Add questions to get started</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving || questions.length === 0 || !title.trim()}
                        className="bg-[#96b902] text-white font-quicksand font-bold text-[14px] px-6 py-3 rounded-[10px] hover:bg-[#82a002] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSaving ? 'Saving...' : 'Save Game'}
                    </button>
                </div>

    </div>
    );
}

export default function GameEditPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
                    <div className="text-[#473025] font-quicksand font-bold text-xl">Loading...</div>
                </div>
            }
        >
            <TeacherPageLayout>
                <GameEditContent />
            </TeacherPageLayout>
        </Suspense>
    );
}
