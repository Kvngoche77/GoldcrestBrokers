import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for Binance 24hr ticker
// Bypasses browser CORS restrictions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`,
      { next: { revalidate: 3 } }
    );

    if (!res.ok) {
      throw new Error(`Binance responded with ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3, stale-while-revalidate=5' }
    });
  } catch (error: any) {
    console.error('[/api/trade/ticker] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch ticker data' }, { status: 502 });
  }
}
