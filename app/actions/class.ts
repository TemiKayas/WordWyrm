'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { uploadClassImage, deleteClassImage } from '@/lib/blob';

// Validation schemas
const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Class name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

const updateClassSchema = z.object({
  classId: z.string(),
  name: z.string().min(1, 'Class name is required').max(100, 'Class name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  isActive: z.boolean().optional(),
});

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Generate 6-character alphanumeric invite code (avoiding ambiguous chars)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

async function generateUniqueInviteCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateInviteCode();
    const existing = await db.inviteCode.findUnique({
      where: { code }
    });
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique invite code');
}

/**
 * Create a new class
 */
export async function createClass(
  formData: FormData
): Promise<ActionResult<{ classId: string; inviteCode: string }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // Get teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Validate data
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
    };

    const validatedData = createClassSchema.parse(rawData);

    // Create class
    const newClass = await db.class.create({
      data: {
        teacherId: teacher.id,
        name: validatedData.name,
        description: validatedData.description,
        isActive: true,
      },
    });

    // Generate invite code
    const inviteCodeStr = await generateUniqueInviteCode();
    await db.inviteCode.create({
      data: {
        classId: newClass.id,
        code: inviteCodeStr,
        isActive: true,
        createdBy: session.user.id,
      },
    });

    revalidatePath('/teacher/dashboard');

    return {
      success: true,
      data: { classId: newClass.id, inviteCode: inviteCodeStr },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    console.error('Create class error:', error);
    return {
      success: false,
      error: 'Failed to create class. Please try again.',
    };
  }
}

/**
 * Get all classes for the current teacher
 */
export async function getTeacherClasses(): Promise<
  ActionResult<
    Array<{
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
    }>
  >
> {
  console.log("--- DEBUG: Entering getTeacherClasses ---");
  try {
    const session = await auth();
    console.log("--- DEBUG: Session object ---", session);

    if (!session?.user || session.user.role !== 'TEACHER') {
      console.log("--- DEBUG: Unauthorized access attempt ---");
      return { success: false, error: 'Unauthorized' };
    }

    console.log("--- DEBUG: User is authorized, fetching teacher profile for userId:", session.user.id);
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });
    console.log("--- DEBUG: Teacher profile ---", teacher);

    if (!teacher) {
      console.log("--- DEBUG: Teacher profile not found ---");
      return { success: false, error: 'Teacher profile not found' };
    }

    const classes = await db.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: {
          select: {
            memberships: true,
            pdfs: true,
            games: true,
          },
        },
        inviteCodes: {
          where: { isActive: true },
          select: {
            code: true,
            isActive: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log("--- DEBUG: Fetched classes count ---", classes.length);

    return { success: true, data: classes };
  } catch (error) {
    console.error('Get teacher classes error:', error);
    return {
      success: false,
      error: 'Failed to fetch classes',
    };
  } finally {
    console.log("--- DEBUG: Exiting getTeacherClasses ---");
  }
}

/**
 * Get a specific class with all its details
 */
export async function getClassDetails(classId: string): Promise<
  ActionResult<{
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    inviteCodes: Array<{
      code: string;
      isActive: boolean;
      usedCount: number;
    }>;
    memberships: Array<{
      id: string;
      user: {
        name: string;
        email: string;
      };
      joinedAt: Date;
    }>;
    pdfs: Array<{
      id: string;
      filename: string;
      uploadedAt: Date;
    }>;
    games: Array<{
      id: string;
      title: string;
      shareCode: string;
      createdAt: Date;
      gameMode: string;
    }>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    const classDetails = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
      include: {
        inviteCodes: {
          where: { isActive: true },
          select: {
            code: true,
            isActive: true,
            usedCount: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        pdfs: {
          select: {
            id: true,
            filename: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
        games: {
          select: {
            id: true,
            title: true,
            shareCode: true,
            createdAt: true,
            gameMode: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!classDetails) {
      return { success: false, error: 'Class not found' };
    }

    return { success: true, data: classDetails };
  } catch (error) {
    console.error('Get class details error:', error);
    return {
      success: false,
      error: 'Failed to fetch class details',
    };
  }
}

/**
 * Update class details
 */
export async function updateClass(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Validate data
    const rawData = {
      classId: formData.get('classId'),
      name: formData.get('name') || undefined,
      description: formData.get('description') || undefined,
      isActive: formData.get('isActive') === 'true' ? true : undefined,
    };

    const validatedData = updateClassSchema.parse(rawData);

    // Verify class belongs to teacher
    const classToUpdate = await db.class.findFirst({
      where: {
        id: validatedData.classId,
        teacherId: teacher.id,
      },
    });

    if (!classToUpdate) {
      return { success: false, error: 'Class not found' };
    }

    // Handle image upload if provided
    let imageUrl = classToUpdate.imageUrl;
    const imageFile = formData.get('image') as File | null;

    if (imageFile && imageFile.size > 0) {
      // Delete old image if exists
      if (classToUpdate.imageUrl) {
        await deleteClassImage(classToUpdate.imageUrl);
      }

      // Upload new image
      imageUrl = await uploadClassImage(imageFile);
    }

    // Update class
    await db.class.update({
      where: { id: validatedData.classId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        imageUrl,
      },
    });

    revalidatePath('/teacher/dashboard');
    revalidatePath(`/teacher/class/${validatedData.classId}`);

    return {
      success: true,
      data: { message: 'Class updated successfully' },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    console.error('Update class error:', error);
    return {
      success: false,
      error: 'Failed to update class',
    };
  }
}

/**
 * Delete a class
 */
export async function deleteClass(
  classId: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Verify class belongs to teacher
    const classToDelete = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classToDelete) {
      return { success: false, error: 'Class not found' };
    }

    // Delete class (cascade will handle related data)
    await db.class.delete({
      where: { id: classId },
    });

    revalidatePath('/teacher/dashboard');

    return {
      success: true,
      data: { message: 'Class deleted successfully' },
    };
  } catch (error) {
    console.error('Delete class error:', error);
    return {
      success: false,
      error: 'Failed to delete class',
    };
  }
}

/**
 * Join a class using an invite code
 */
export async function joinClass(
  inviteCode: string
): Promise<ActionResult<{ classId: string; className: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find invite code
    const invite = await db.inviteCode.findUnique({
      where: { code: inviteCode },
      include: {
        class: true,
      },
    });

    if (!invite || !invite.isActive) {
      return { success: false, error: 'Invalid or inactive invite code' };
    }

    // Check if user is already a member
    const existingMembership = await db.classMembership.findUnique({
      where: {
        classId_userId: {
          classId: invite.classId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      return { success: false, error: 'You are already a member of this class' };
    }

    // Create membership
    await db.classMembership.create({
      data: {
        classId: invite.classId,
        userId: session.user.id,
        role: 'student',
      },
    });

    // Increment invite code usage count
    await db.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    revalidatePath('/student/dashboard');

    return {
      success: true,
      data: { classId: invite.classId, className: invite.class.name },
    };
  } catch (error) {
    console.error('Join class error:', error);
    return {
      success: false,
      error: 'Failed to join class',
    };
  }
}

/**
 * Get all classes for the current student
 */
export async function getStudentClasses(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      description: string | null;
      joinedAt: Date;
      teacher: {
        name: string;
        school: string | null;
      };
      _count: {
        games: number;
      };
    }>
  >
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all class memberships for the student
    const memberships = await db.classMembership.findMany({
      where: { userId: session.user.id },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                school: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                games: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const classes = memberships.map((membership) => ({
      id: membership.class.id,
      name: membership.class.name,
      description: membership.class.description,
      joinedAt: membership.joinedAt,
      teacher: {
        name: membership.class.teacher.user.name,
        school: membership.class.teacher.school,
      },
      _count: {
        games: membership.class._count.games,
      },
    }));

    return { success: true, data: classes };
  } catch (error) {
    console.error('Get student classes error:', error);
    return {
      success: false,
      error: 'Failed to fetch classes',
    };
  }
}

/**
 * Update class image
 */
export async function updateClassImage(
  classId: string,
  formData: FormData
): Promise<ActionResult<{ imageUrl: string }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Verify class belongs to teacher
    const classToUpdate = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classToUpdate) {
      return { success: false, error: 'Class not found' };
    }

    const file = formData.get('image') as File;
    if (!file) {
      return { success: false, error: 'No image provided' };
    }

    // Delete old image if exists
    if (classToUpdate.imageUrl) {
      try {
        await deleteClassImage(classToUpdate.imageUrl);
      } catch (error) {
        console.error('Failed to delete old class image:', error);
      }
    }

    // Upload new image
    const imageUrl = await uploadClassImage(file);

    // Update class
    await db.class.update({
      where: { id: classId },
      data: { imageUrl },
    });

    revalidatePath('/teacher/dashboard');
    revalidatePath(`/teacher/class/${classId}`);

    return {
      success: true,
      data: { imageUrl },
    };
  } catch (error) {
    console.error('Update class image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update class image',
    };
  }
}

/**
 * Get a specific class details for a student
 */
export async function getStudentClassDetails(classId: string): Promise<
  ActionResult<{
    id: string;
    name: string;
    description: string | null;
    teacher: {
      name: string;
      school: string | null;
    };
    games: Array<{
      id: string;
      title: string;
      shareCode: string;
      gameMode: string;
      createdAt: Date;
    }>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if student is a member of this class
    const membership = await db.classMembership.findUnique({
      where: {
        classId_userId: {
          classId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return { success: false, error: 'You are not a member of this class' };
    }

    // Get class details
    const classDetails = await db.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            school: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        games: {
          where: { active: true },
          select: {
            id: true,
            title: true,
            shareCode: true,
            gameMode: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!classDetails) {
      return { success: false, error: 'Class not found' };
    }

    return {
      success: true,
      data: {
        id: classDetails.id,
        name: classDetails.name,
        description: classDetails.description,
        teacher: {
          name: classDetails.teacher.user.name,
          school: classDetails.teacher.school,
        },
        games: classDetails.games,
      },
    };
  } catch (error) {
    console.error('Get student class details error:', error);
    return {
      success: false,
      error: 'Failed to fetch class details',
    };
  }
}
