'use client';

import Button from '@/components/ui/Button';

type CreateClassModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function CreateClassModal({
  isOpen,
  isCreating,
  error,
  onClose,
  onSubmit
}: CreateClassModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-[3px] border-[#473025] rounded-[20px] p-6 w-full max-w-md">
        <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-4">
          Create New Class
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3">
              <span className="font-quicksand text-sm text-red-600">{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="name" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
              Class Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              maxLength={100}
              className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-quicksand text-[#473025] focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all"
              placeholder="e.g., AP English Literature"
            />
          </div>
          <div>
            <label htmlFor="description" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-quicksand text-[#473025] focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all resize-none"
              placeholder="Add a description for your class..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="md"
              className="flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              disabled={isCreating}
              isLoading={isCreating}
            >
              Create Class
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
