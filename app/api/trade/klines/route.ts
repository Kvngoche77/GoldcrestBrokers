import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for Binance Klines (candlestick data)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '200';

  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  if (!validIntervals.includes(interval)) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`,
      { next: { revalidate: interval === '1m' ? 30 : 60 } }
    );

    if (!res.ok) {
      throw new Error(`Binance responded with ${res.status}`);
    }

    const data = await res.json();
    
    // Transform klines to lightweight-charts format
    const candlesticks = data.map((d: any) => ({
      time: Math.floor(d[0] / 1000),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));

    return NextResponse.json(candlesticks, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' }
    });
  } catch (error: any) {
    console.error('[/api/trade/klines] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch klines data' }, { status: 502 });
  }
}
