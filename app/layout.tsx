import type { Metadata } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ProfileProvider } from "@/lib/contexts/ProfileContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WordWyrm - Transform PDFs into Engaging Quizzes",
  description: "Create interactive quizzes from PDFs using AI-powered content generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="wordwyrm" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
      >
        <ProfileProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
