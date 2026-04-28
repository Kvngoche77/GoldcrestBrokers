import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids') || 'bitcoin,ethereum,binancecoin,solana,cardano,ripple';
  const sparkline = searchParams.get('sparkline') === 'true';
  const per_page = searchParams.get('per_page') || '10';

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=${per_page}&page=1${sparkline ? '&sparkline=true' : ''}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error('Failed to fetch from CoinGecko');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
