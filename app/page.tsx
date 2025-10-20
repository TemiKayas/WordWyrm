import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const session = await auth();

  // redirect authenticated users to their dashboard
  if (session?.user) {
    const redirectPath =
      session.user.role === 'TEACHER'
        ? '/teacher/dashboard'
        : '/student/dashboard';
    redirect(redirectPath);
  }

  return (
    <div className="min-h-screen bg-cream shadow-[0px_2px_2px_0px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center p-4 py-8">
      {/* wordwyrm logo at top */}
      <div className="mb-12 lg:mb-16">
        <Image
          src="/assets/WordWyrm.svg"
          alt="WordWyrm"
          width={300}
          height={60}
          className="object-contain"
        />
      </div>

      {/* main content */}
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20 max-w-6xl mx-auto">
        {/* left side - gif (looping indefinitely) */}
        <div className="flex-shrink-0">
          <img
            src="/assets/main.gif"
            alt="WordWyrm mascot"
            width={443}
            height={443}
            className="object-contain"
          />
        </div>

        {/* right side - content */}
        <div className="flex flex-col items-start gap-8 max-w-xl">
          <h2 className="font-quicksand font-bold text-brown text-[36px] lg:text-[48px] leading-tight">
            Scales, tales, and everything in between.
          </h2>

          <div className="flex flex-col gap-[30px] w-full max-w-[413px]">
            <Link
              href="/login"
              className="bg-white border-brown border-[5px] hover:bg-cream hover:shadow-md text-brown font-quicksand font-bold text-[24px] text-center rounded-[13px] h-[76px] flex items-center justify-center transition-all"
            >
              Log in or Sign up
            </Link>

            <Link
              href="/create-game"
              className="bg-[#473025] border-brown border-[5px] hover:bg-brown-dark hover:shadow-md text-white font-quicksand font-bold text-[24px] text-center rounded-[13px] h-[74px] flex items-center justify-center transition-all"
            >
              I have a Game Code
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
