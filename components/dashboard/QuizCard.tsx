'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteQuiz, updateQuizTitle } from '@/app/actions/quiz';
import { createGameFromQuiz } from '@/app/actions/game';
import Button from '@/components/ui/Button';

interface QuizCardProps {
  quiz: {
    id: string;
    title: string | null;
    numQuestions: number;
    createdAt: Date;
    hasGame: boolean;
    gameId?: string;
    pdfFilename?: string;
  };
  onUpdate: () => void;
}

export default function QuizCard({ quiz, onUpdate }: QuizCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(quiz.title || 'Untitled Quiz');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleSaveTitle = async () => {
    const result = await updateQuizTitle(quiz.id, editedTitle);
    if (result.success) {
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete any associated games.')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteQuiz(quiz.id);
    if (result.success) {
      onUpdate();
    } else {
      alert(result.error);
      setIsDeleting(false);
    }
  };

  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    const result = await createGameFromQuiz(quiz.id, editedTitle);
    if (result.success) {
      router.push(`/teacher/game-preview?gameId=${result.data.gameId}`);
    } else {
      alert(result.error);
      setIsCreatingGame(false);
    }
  };

  const handleViewGame = () => {
    if (quiz.gameId) {
      router.push(`/teacher/game-preview?gameId=${quiz.gameId}`);
    }
  };

  return (
    <div className="bg-cream border-2 border-[#c4a46f] rounded-lg p-4 hover:border-brown transition-all relative">
      {/* menu button */}
      <button
        onClick={() => setShowActions(!showActions)}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-brown/10 transition-colors"
      >
        <svg className="w-5 h-5 text-brown" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* dropdown menu */}
      {showActions && (
        <div className="absolute top-10 right-2 bg-white border-2 border-brown rounded-lg shadow-lg z-10 min-w-[150px]">
          <button
            onClick={() => {
              setIsEditing(true);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-cream transition-colors font-quicksand text-brown text-sm"
          >
            Edit Title
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 hover:bg-cream transition-colors font-quicksand text-error text-sm border-t border-brown/20"
          >
            Delete Quiz
          </button>
        </div>
      )}

      {/* title */}
      {isEditing ? (
        <div className="mb-2">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-2 py-1 border-2 border-brown rounded font-quicksand font-bold text-brown text-lg"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <Button
              onClick={handleSaveTitle}
              variant="success"
              size="sm"
            >
              Save
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditedTitle(quiz.title || 'Untitled Quiz');
              }}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="font-quicksand font-bold text-brown text-lg mb-2 pr-8">
          {quiz.title || 'Untitled Quiz'}
        </p>
      )}

      {/* metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
        <p className="font-quicksand text-[#c4a46f]">
          <span className="font-semibold text-brown">{quiz.numQuestions}</span> questions
        </p>
        {quiz.pdfFilename && (
          <p className="font-quicksand text-[#c4a46f]">
            From: <span className="font-semibold text-brown">{quiz.pdfFilename}</span>
          </p>
        )}
        <p className="font-quicksand text-[#c4a46f]">
          Created {formatDate(quiz.createdAt)}
        </p>
      </div>

      {/* action buttons */}
      <div className="flex gap-2 flex-wrap">
        {quiz.hasGame ? (
          <Button
            onClick={handleViewGame}
            variant="success"
            size="sm"
          >
            View Game
          </Button>
        ) : (
          <Button
            onClick={handleCreateGame}
            disabled={isCreatingGame}
            isLoading={isCreatingGame}
            variant="success"
            size="sm"
          >
            {isCreatingGame ? 'Creating...' : 'Create Game'}
          </Button>
        )}
      </div>

      {isDeleting && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <p className="font-quicksand font-bold text-brown">Deleting...</p>
        </div>
      )}
    </div>
  );
}
