'use server';

import { db } from '@/lib/db';
import { signIn } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { AuthError } from 'next-auth';

// Helper to check if error is a redirect error from Next.js
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT')
  );
}

// Validation schemas
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['TEACHER', 'STUDENT']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function signup(
  formData: FormData
): Promise<ActionResult<{ message: string; role: string }>> {
  try {
    // Extract and validate data
    const rawData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
    };

    const validatedData = signupSchema.parse(rawData);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists',
      };
    }

    // Hash password
    const passwordHash = await hash(validatedData.password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
      },
    });

    // Create role-specific profile
    if (validatedData.role === 'TEACHER') {
      await db.teacher.create({
        data: {
          userId: user.id,
        },
      });
    } else if (validatedData.role === 'STUDENT') {
      await db.student.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Auto sign in after signup with redirect
    const redirectPath = validatedData.role === 'TEACHER'
      ? '/teacher/dashboard'
      : '/student/dashboard';

    try {
      await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirectTo: redirectPath,
      });
    } catch (error) {
      // Re-throw redirect errors (this is how Next.js handles redirects)
      if (isRedirectError(error)) {
        throw error;
      }

      // If auto-signin fails for other reasons, user needs to login manually
      console.error('Auto-signin failed:', error);
      // Return success but user will need to login
      return {
        success: true,
        data: { message: 'Account created successfully. Please login.', role: user.role },
      };
    }

    // This will never be reached if signIn succeeds (it redirects)
    return {
      success: true,
      data: { message: 'Account created successfully', role: user.role },
    };
  } catch (error) {
    // Re-throw redirect errors (this is how Next.js handles redirects)
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    console.error('Signup error:', error);
    return {
      success: false,
      error: 'We couldn\'t create your account. This may be due to a temporary issue. Please try again in a few moments.',
    };
  }
}

export async function login(
  formData: FormData,
  callbackUrl?: string
): Promise<ActionResult<{ message: string; role: string }>> {
  try {
    // Extract and validate data
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const validatedData = loginSchema.parse(rawData);

    // Get user to check role before signing in
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.',
      };
    }

    // Determine redirect path
    // If there's a callback URL and it matches user's role, use it
    // Otherwise, redirect to appropriate dashboard
    let redirectPath = user.role === 'TEACHER'
      ? '/teacher/dashboard'
      : user.role === 'STUDENT'
      ? '/student/dashboard'
      : '/';

    if (callbackUrl) {
      // Validate callback URL is safe and matches user's role
      const isTeacherRoute = callbackUrl.startsWith('/teacher');
      const isStudentRoute = callbackUrl.startsWith('/student');
      const isPlayRoute = callbackUrl.startsWith('/play');

      // Allow callback if:
      // - It's a /play route (accessible by anyone)
      // - It matches user's role (/teacher for teachers, /student for students)
      if (isPlayRoute ||
          (isTeacherRoute && user.role === 'TEACHER') ||
          (isStudentRoute && user.role === 'STUDENT')) {
        redirectPath = callbackUrl;
      }
    }

    // Attempt sign in with redirect
    // NextAuth will handle the session creation and redirect
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: redirectPath,
    });

    // This line will never be reached because signIn will redirect
    // But we need it for TypeScript
    return {
      success: true,
      data: { message: 'Logged in successfully', role: user.role },
    };
  } catch (error) {
    // Re-throw redirect errors (this is how Next.js handles redirects in server actions)
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'Invalid email or password',
          };
        default:
          return {
            success: false,
            error: 'Authentication failed. Please try again.',
          };
      }
    }

    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/' });
}

export async function setUserRole(role: 'TEACHER' | 'STUDENT') {
  const { auth: getSession, signOut } = await import('@/lib/auth');
  const session = await getSession();

  if (!session?.user?.id || !session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const userEmail = session.user.email;

  // Update user role in database
  await db.user.update({
    where: { id: session.user.id },
    data: { role },
  });

  // Create role-specific profile
  if (role === 'TEACHER') {
    await db.teacher.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });
  } else if (role === 'STUDENT') {
    await db.student.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });
  }

  // Sign out to clear old JWT token
  await signOut({ redirect: false });

  // Sign back in with Google to get fresh JWT with new role
  const redirectPath = role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
  await signIn('google', { redirectTo: redirectPath });
}
