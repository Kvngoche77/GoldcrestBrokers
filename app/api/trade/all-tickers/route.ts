import { NextResponse } from 'next/server';

// Fetch mini tickers for all symbols at once (used for watchlist price updates)
export async function GET() {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr',
      { next: { revalidate: 5 } }
    );

    if (!res.ok) {
      throw new Error(`Binance responded with ${res.status}`);
    }

    const data = await res.json();
    
    // Only return the fields we need (reduce payload size)
    const filtered = data
      .filter((t: any) => t.symbol.endsWith('USDT'))
      .map((t: any) => ({
        symbol: t.symbol,
        lastPrice: t.lastPrice,
        priceChangePercent: t.priceChangePercent,
        highPrice: t.highPrice,
        lowPrice: t.lowPrice,
        volume: t.volume,
      }));

    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 's-maxage=5, stale-while-revalidate=10' }
    });
  } catch (error: any) {
    console.error('[/api/trade/all-tickers] Error:', error.message);
    return NextResponse.json([], { status: 502 });
  }
}
