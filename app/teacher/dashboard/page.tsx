'use client';

import { useEffect, useState } from 'react';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import Button from '@/components/ui/Button';
import { getTeacherClasses, createClass, deleteClass, updateClass } from '@/app/actions/class';
import ClassCard from './components/ClassCard';
import ClassMenu from './components/ClassMenu';
import CreateClassModal from './components/CreateClassModal';
import EditClassModal from './components/EditClassModal';
import EmptyState from './components/EmptyState';
import CreateClassCard from './components/CreateClassCard';

type ClassData = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    memberships: number;
    pdfs: number;
    games: number;
  };
  inviteCodes: Array<{
    code: string;
    isActive: boolean;
  }>;
};

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    setIsLoading(true);
    console.log('[Dashboard] Loading classes...');
    const result = await getTeacherClasses();
    console.log('[Dashboard] Result:', result);
    if (result.success) {
      console.log('[Dashboard] Classes loaded:', result.data.length);
      setClasses(result.data);
    } else {
      console.error('[Dashboard] Failed to load classes:', result.error);
    }
    setIsLoading(false);
  }

  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const result = await createClass(formData);

    if (result.success) {
      setShowCreateModal(false);
      await loadClasses();
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error);
    }

    setIsCreating(false);
  };

  const handleEditClass = (classItem: ClassData) => {
    setEditingClass(classItem);
    setImagePreview(classItem.imageUrl);
    setSelectedImage(null);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClass) return;

    setIsCreating(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.append('classId', editingClass.id);

    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    const result = await updateClass(formData);

    if (result.success) {
      await loadClasses();
      setShowEditModal(false);
      setEditingClass(null);
      setSelectedImage(null);
      setImagePreview(null);
    } else {
      setError(result.error);
    }

    setIsCreating(false);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return;
    }

    setOpenMenuId(null);
    const result = await deleteClass(classId);

    if (result.success) {
      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
    } else {
      alert(result.error);
    }
  };

  const handleMenuClick = (classId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    });
    setOpenMenuId(openMenuId === classId ? null : classId);
  };

  const handleCloseMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingClass(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  if (isLoading) {
    return (
      <TeacherPageLayout>
        <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
          <p className="font-quicksand font-bold text-[#473025] text-[20px]">Loading classes...</p>
        </div>
      </TeacherPageLayout>
    );
  }

  return (
    <TeacherPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - Only show when there are classes */}
        {classes.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-quicksand font-bold text-[#473025] text-[32px] leading-[1.198]">
                My Classes
              </h1>
              <p className="font-quicksand text-[#bfa183] text-[20px] mt-1">
                Manage your classes and create new games
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
            >
              + Create Class
            </Button>
          </div>
        )}

        {/* Empty State */}
        {classes.length === 0 && (
          <EmptyState onCreateClass={() => setShowCreateModal(true)} />
        )}

        {/* Classes Grid */}
        {classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onMenuClick={handleMenuClick}
              />
            ))}
            <CreateClassCard onClick={() => setShowCreateModal(true)} />
          </div>
        )}
      </div>

      {/* Class Menu Dropdown */}
      {openMenuId && menuPosition && (() => {
        const currentClass = classes.find(c => c.id === openMenuId);
        if (!currentClass) return null;

        return (
          <ClassMenu
            classId={currentClass.id}
            className={currentClass.name}
            position={menuPosition}
            onClose={handleCloseMenu}
            onEdit={() => handleEditClass(currentClass)}
            onDelete={() => void handleDeleteClass(currentClass.id, currentClass.name)}
          />
        );
      })()}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showCreateModal}
        isCreating={isCreating}
        error={error}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClass}
      />

      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={showEditModal}
        isUpdating={isCreating}
        error={error}
        classData={editingClass}
        imagePreview={imagePreview}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateClass}
        onImageSelect={handleImageSelect}
      />
    </TeacherPageLayout>
  );
}
