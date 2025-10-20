'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await login(formData);

        if (!result.success) {
          setError(result.error);
        } else {
          // Redirect based on user role
          if (result.data.role === 'TEACHER') {
            router.push('/teacher/dashboard');
          } else if (result.data.role === 'STUDENT') {
            router.push('/student/dashboard');
          } else {
            router.push('/');
          }
          router.refresh();
        }
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
        {/* left side - gif */}
        <div className="flex-shrink-0">
          <img
            src="/assets/dashboard/avatars/student-3.png"
            alt="WordWyrm mascot"
            width={400}
            height={400}
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

            <form action={handleSubmit} className="space-y-6">
              {error && (
                <div className="alert alert-error bg-red-100 border-2 border-error rounded-lg p-3">
                  <span className="font-quicksand text-sm text-error">{error}</span>
                </div>
              )}

              {/* email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-quicksand font-semibold text-brown">Email Address</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Enter your Email Address"
                  className="input bg-[#f5ebe0] border-0 font-quicksand placeholder:text-[#c4a46f] focus:outline-none focus:ring-2 focus:ring-brown"
                />
              </div>

              {/* password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-quicksand font-semibold text-brown">Password</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="input bg-[#f5ebe0] border-0 font-quicksand placeholder:text-brown focus:outline-none focus:ring-2 focus:ring-brown"
                />
              </div>

              {/* login button */}
              <button
                type="submit"
                disabled={isPending}
                className="bg-[#473025] border-0 hover:cursor-pointer hover:bg-brown-dark text-white font-quicksand font-bold text-[20px] w-full rounded-[7px] h-[55px] flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isPending ? 'Signing in...' : 'Log In'}
              </button>

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
