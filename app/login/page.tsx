'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await login(formData);

        if (!result.success) {
          setError(result.error);
        }
      } catch {
        // NextAuth redirects on success, which throws an error
        // So we catch it and manually redirect
        router.push('/');
        router.refresh();
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
        <div className="card bg-cream-darkborder-[#473025] border-4 shadow-xl w-full max-w-md rounded-[30px]">
          <div className="card-body p-8">
            {/* tabs */}
            <div className="tabs tabs-boxed bg-transparent mb-6">
              <button
                className={`tab tab-lg mr-2 font-quicksand font-semibold ${!isSignUp ? 'tab-active bg-cream-dark' : 'bg-transparent'}`}
                onClick={() => setIsSignUp(false)}
              >
                Log In
              </button>
              <button
                className={`tab gap-4 tab-lg font-quicksand font-semibold ${isSignUp ? 'tab-active bg-cream-dark' : 'bg-transparent'}`}
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
            </div>

            <form action={handleSubmit} className="space-y-6">
              {error && (
                <div className="alert alert-error">
                  <span className="font-quicksand text-sm">{error}</span>
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
                className="bg-[#473025] border-0 hover:cursor-pointer hover:bg-brown-dark text-white font-quicksand font-bold text-[20px] w-full rounded-[7px] h-[55px] flex items-center justify-center transition-all"
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

              {/* social buttons */}
              <button
                type="button"
                className="bg-[#f1e8d9] border-0 hover:bg-[#ede3d8] text-brown font-quicksand font-bold text-[18px] w-full rounded-[7px] h-[55px] flex items-center justify-center gap-3 transition-all"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
