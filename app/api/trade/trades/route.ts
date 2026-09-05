import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for Binance Recent Trades
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const limit = searchParams.get('limit') || '30';

  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=${limit}`,
      { next: { revalidate: 2 } }
    );

    if (!res.ok) {
      throw new Error(`Binance responded with ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=2, stale-while-revalidate=3' }
    });
  } catch (error: any) {
    console.error('[/api/trade/trades] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch recent trades' }, { status: 502 });
  }
}
