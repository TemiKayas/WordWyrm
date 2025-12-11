import { NextResponse } from 'next/server';

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER DEBUGGING
export async function GET() {
  return NextResponse.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    // Show first/last 4 chars to verify it's the right one
    clientIdPreview: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 4)}...${process.env.GOOGLE_CLIENT_ID.slice(-20)}`
      : 'NOT SET',
  });
}
