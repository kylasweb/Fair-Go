import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    return NextResponse.json({
      ok: true,
      uptime: uptimeSeconds,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'fairgo-platform'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'health_check_failed' }, { status: 500 });
  }
}