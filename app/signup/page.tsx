'use client';

import { useState, useTransition } from 'react';
import { signup } from '@/app/actions/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await signup(formData);

        if (!result.success) {
          setError(result.error);
        } else if (result.data.message.includes('Please login')) {
          // Auto-signin failed, redirect to login
          router.push('/login');
        }
        // No else needed - server action will redirect on successful auto-signin
      } catch (err) {
        console.error('Signup error:', err);
        setError('An unexpected error occurred');
      }
    });
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      {/* navbar */}
      <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 bg-[#fffaf2] border-b-2 border-[#473025]/10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
            <Image
              src="/assets/dashboard/wordwyrm-logo.png"
              alt="WordWyrm"
              fill
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      {/* main content */}
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 max-w-6xl mx-auto mt-20">
        {/* left side - dragon character */}
        <div className="flex-shrink-0">
          <img
            src="/assets/dashboard/avatars/dragon-teaching.png"
            alt="WordWyrm mascot"
            width={312}
            height={312}
            className="object-contain"
          />
        </div>

        {/* right side - signup form */}
        <div className="card bg-cream-dark border-[#473025] border-4 shadow-xl w-full max-w-2xl rounded-[30px]">
          <div className="card-body p-8">
            {/* title */}
            <h2 className="font-quicksand font-bold text-brown text-[32px] text-center mb-6">
              Create Account
            </h2>

            <form action={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert alert-error bg-red-100 border-2 border-error rounded-lg p-3">
                  <span className="font-quicksand text-sm text-error">{error}</span>
                </div>
              )}

              {/* name */}
              <div className="space-y-2">
                <label htmlFor="name" className="font-quicksand font-bold text-[#473025] text-[16px]">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Enter your full name"
                  className="w-full bg-[#fffbf6] border-[3px] border-[#473025] rounded-[11px] h-[50px] px-4 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all"
                />
              </div>

              {/* email */}
              <div className="space-y-2">
                <label htmlFor="email" className="font-quicksand font-bold text-[#473025] text-[16px]">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full bg-[#fffbf6] border-[3px] border-[#473025] rounded-[11px] h-[50px] px-4 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all"
                />
              </div>

              {/* password */}
              <div className="space-y-2">
                <label htmlFor="password" className="font-quicksand font-bold text-[#473025] text-[16px]">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#fffbf6] border-[3px] border-[#473025] rounded-[11px] h-[50px] px-4 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all"
                />
              </div>

              {/* role selection */}
              <div className="space-y-2">
                <label className="font-quicksand font-bold text-[#473025] text-[16px]">
                  I am a...
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center p-4 bg-[#fffbf6] border-[3px] border-[#473025] rounded-[11px] cursor-pointer hover:bg-[#fff5e8] hover:border-[#ff9f22] transition-all">
                    <input
                      type="radio"
                      name="role"
                      value="TEACHER"
                      required
                      className="radio radio-sm mr-3 accent-[#473025]"
                    />
                    <div>
                      <div className="font-quicksand font-bold text-[#473025] text-[15px]">Teacher</div>
                      <div className="font-quicksand text-xs text-[#a7613c]">
                        Create and manage quizzes
                      </div>
                    </div>
                  </label>

                  <label className="flex-1 flex items-center p-4 bg-[#fffbf6] border-[3px] border-[#473025] rounded-[11px] cursor-pointer hover:bg-[#fff5e8] hover:border-[#ff9f22] transition-all">
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      required
                      className="radio radio-sm mr-3 accent-[#473025]"
                    />
                    <div>
                      <div className="font-quicksand font-bold text-[#473025] text-[15px]">Student</div>
                      <div className="font-quicksand text-xs text-[#a7613c]">
                        Join and play quizzes
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* signup button */}
              <Button
                type="submit"
                disabled={isPending}
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isPending}
              >
                Sign Up
              </Button>

              {/* divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute w-full h-[2px] bg-[#dfc8a3]"></div>
                <div className="relative bg-[#fffcf8] px-4">
                  <p className="font-quicksand font-bold text-[#dfc8a3] text-[14px]">OR</p>
                </div>
              </div>

              {/* login link */}
              <div className="text-center">
                <p className="font-quicksand text-brown text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold text-[#ff9f22] hover:underline">
                    Log In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
