import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {};

  // ── Supabase connectivity check ──────────────────────────────────
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const dbStart = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.database = {
      status: error ? 'error' : 'ok',
      latencyMs: Date.now() - dbStart,
      ...(error ? { error: error.message } : {}),
    };
  } catch (err: any) {
    checks.database = { status: 'error', error: err?.message || 'Unknown error' };
  }

  // ── Environment variable check ───────────────────────────────────
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  checks.environment = {
    status: missingEnvVars.length === 0 ? 'ok' : 'error',
    ...(missingEnvVars.length > 0 ? { error: `Missing: ${missingEnvVars.join(', ')}` } : {}),
  };

  // ── Overall status ───────────────────────────────────────────────
  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const totalLatencyMs = Date.now() - startTime;

  const body = {
    status: allOk ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    totalLatencyMs,
    checks,
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
