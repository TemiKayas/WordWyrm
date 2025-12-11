import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to import auth config
    const { auth } = await import('@/lib/auth');

    return NextResponse.json({
      status: 'ok',
      message: 'Auth config loaded successfully'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
