'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { Suspense } from 'react';

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await login(formData, callbackUrl || undefined);

        if (!result.success) {
          setError(result.error);
        }
        // No need for else - server action will redirect on success
      } catch (err) {
        console.error('Login error:', err);
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

        {/* right side - login form */}
        <div className="card bg-cream-dark border-[#473025] border-4 shadow-xl w-full max-w-md rounded-[30px]">
          <div className="card-body p-8">
            {/* title */}
            <h2 className="font-quicksand font-bold text-brown text-[32px] text-center mb-6">
              Welcome Back!
            </h2>

            <form action={handleSubmit} className="space-y-5">
              {error && (
                <div className="alert alert-error bg-red-100 border-2 border-error rounded-lg p-3">
                  <span className="font-quicksand text-sm text-error">{error}</span>
                </div>
              )}

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
                  placeholder="Enter your password"
                  className="w-full bg-[#fffbf6] border-[3px] border-[#473025] rounded-[11px] h-[50px] px-4 font-quicksand text-[#473025] placeholder:text-[#a7613c] focus:outline-none focus:ring-2 focus:ring-[#ff9f22] hover:border-[#ff9f22] transition-all"
                />
              </div>

              {/* login button */}
              <Button
                type="submit"
                disabled={isPending}
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isPending}
              >
                Log In
              </Button>

              {/* divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute w-full h-[2px] bg-[#dfc8a3]"></div>
                <div className="relative bg-[#fffcf8] px-4">
                  <p className="font-quicksand font-bold text-[#dfc8a3] text-[14px]">OR</p>
                </div>
              </div>

              {/* sign up link */}
              <div className="text-center">
                <p className="font-quicksand text-brown text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-bold text-[#ff9f22] hover:underline">
                    Sign Up
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
