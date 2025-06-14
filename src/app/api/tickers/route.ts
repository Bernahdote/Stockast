import { NextResponse } from 'next/server';

const YAHOO_API = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=';
const TOP_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];

export async function GET() {
  const ftpUrl = 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt';

  try {
    // 1. 티커 전체 목록
    const res = await fetch(ftpUrl);
    const text = await res.text();
    const lines = text.split('\n');
    const headers = lines[0].split('|');
    const tickerIndex = headers.indexOf('Symbol');
    const nameIndex = headers.indexOf('Security Name');
    const tickers = lines
      .slice(1, -2)
      .map(line => line.split('|')[tickerIndex])
      .filter(t => !!t && !t.includes('File Creation Time'));

    // 2. 상위 5개 티커 실시간 정보
    const yahooRes = await fetch(YAHOO_API + TOP_TICKERS.join(','));
    const yahooData = await yahooRes.json();
    const topDetails = (yahooData.quoteResponse.result || []).map((item: any) => ({
      symbol: item.symbol,
      name: item.longName || item.shortName || '',
      price: item.regularMarketPrice,
      change: item.regularMarketChangePercent,
      close: item.regularMarketPreviousClose,
      logo: `https://logo.clearbit.com/${getDomainBySymbol(item.symbol)}`
    }));

    return NextResponse.json({ tickers, topDetails });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch NASDAQ tickers' }, { status: 500 });
  }
}

// 심볼별 도메인 매핑 (실제 서비스라면 DB나 별도 매핑 필요)
function getDomainBySymbol(symbol: string): string {
  const map: Record<string, string> = {
    AAPL: 'apple.com',
    MSFT: 'microsoft.com',
    GOOGL: 'google.com',
    AMZN: 'amazon.com',
    NVDA: 'nvidia.com',
  };
  return map[symbol] || 'nasdaq.com';
} 