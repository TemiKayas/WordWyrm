'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function markOnboardingComplete(): Promise<
  ActionResult<{ completed: boolean }>
> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { hasCompletedOnboarding: true },
    });

    return { success: true, data: { completed: true } };
  } catch (error) {
    console.error('Mark onboarding complete error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to mark onboarding complete',
    };
  }
}

export async function checkOnboardingStatus(): Promise<
  ActionResult<{ completed: boolean; role: string }>
> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        hasCompletedOnboarding: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      data: {
        completed: user.hasCompletedOnboarding,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Check onboarding status error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to check onboarding status',
    };
  }
}
