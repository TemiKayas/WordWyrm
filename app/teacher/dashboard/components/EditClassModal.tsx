'use client';

import Image from 'next/image';
import Button from '@/components/ui/Button';

type EditClassModalProps = {
  isOpen: boolean;
  isUpdating: boolean;
  error: string;
  classData: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  } | null;
  imagePreview: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function EditClassModal({
  isOpen,
  isUpdating,
  error,
  classData,
  imagePreview,
  onClose,
  onSubmit,
  onImageSelect
}: EditClassModalProps) {
  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-[3px] border-[#473025] rounded-[20px] p-6 w-full max-w-md">
        <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-4">
          Edit Class
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3">
              <span className="font-quicksand text-sm text-red-600">{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="edit-name" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
              Class Name
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              required
              maxLength={100}
              defaultValue={classData.name}
              className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-quicksand text-[#473025] focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all"
              placeholder="e.g., AP English Literature"
            />
          </div>
          <div>
            <label htmlFor="edit-description" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
              Description (Optional)
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={classData.description || ''}
              className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-quicksand text-[#473025] focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all resize-none"
              placeholder="Add a description for your class..."
            />
          </div>
          <div>
            <label htmlFor="edit-image" className="block font-quicksand font-bold text-[#473025] text-[15px] mb-2">
              Cover Image (Optional)
            </label>
            <input
              type="file"
              id="edit-image"
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-[#473025]">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <label
                htmlFor="edit-image"
                className="cursor-pointer px-4 py-2 bg-[#fffcf8] border-2 border-[#473025] rounded-lg font-quicksand font-bold text-[#473025] hover:bg-[#fff5e8] transition-colors"
              >
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="md"
              className="flex-1"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              disabled={isUpdating}
              isLoading={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
